from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from dateutil.relativedelta import relativedelta
import uuid


class User(AbstractUser):
    """Custom User model with UUID primary key and credit system"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, help_text="Unique identifier for the user")

    # Credit system fields
    total_credits = models.IntegerField(
        default=100,
        help_text="Current credit balance. Each message costs credits."
    )
    credits_used = models.IntegerField(
        default=0,
        help_text="Total credits used historically for tracking"
    )
    credit_refresh_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when credits were last refreshed. Credits refresh monthly from this date."
    )

    class Meta:
        # Use a different table name to avoid conflicts during migration
        # Can be changed back to 'auth_user' after migration if needed
        db_table = 'api_agents_user'
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def has_credits(self, required_credits=1):
        """Check if user has enough credits"""
        return self.total_credits >= required_credits

    def deduct_credits(self, amount=1):
        """Deduct credits from user balance"""
        if not self.has_credits(amount):
            raise ValueError("Insufficient credits")
        self.total_credits -= amount
        self.credits_used += amount
        self.save(update_fields=['total_credits', 'credits_used'])

    def add_credits(self, amount):
        """Add credits to user balance"""
        self.total_credits += amount
        self.save(update_fields=['total_credits'])

    def check_and_refresh_credits(self):
        """
        Check if credits need to be refreshed (monthly).
        If credit_refresh_date is None, set it to now.
        If a month has passed since last refresh, reset credits to 100.
        """
        now = timezone.now()

        # First time - set the refresh date
        if self.credit_refresh_date is None:
            self.credit_refresh_date = now
            self.save(update_fields=['credit_refresh_date'])
            return

        # Calculate next refresh date (one month from last refresh)
        next_refresh_date = self.credit_refresh_date + relativedelta(months=1)

        # If current time has passed the next refresh date, refresh credits
        if now >= next_refresh_date:
            self.total_credits = 100  # Reset to default amount
            self.credit_refresh_date = now  # Update refresh date
            self.save(update_fields=['total_credits', 'credit_refresh_date'])

    def get_next_refresh_date(self):
        """
        Get the next credit refresh date.
        Returns None if credit_refresh_date is not set.
        """
        if self.credit_refresh_date is None:
            return None
        return self.credit_refresh_date + relativedelta(months=1)


class UserProfile(models.Model):
    """Extended user profile with verification status and token"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_verified = models.BooleanField(default=False, help_text="Whether the user's email is verified")
    verification_token = models.CharField(max_length=255, blank=True, null=True, help_text="Email verification token")
    verification_token_created_at = models.DateTimeField(null=True, blank=True, help_text="When the verification token was created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - Verified: {self.is_verified}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create UserProfile and set credit refresh date when User is created"""
    if created:
        UserProfile.objects.get_or_create(user=instance)
        # Set initial credit refresh date
        if instance.credit_refresh_date is None:
            instance.credit_refresh_date = timezone.now()
            instance.save(update_fields=['credit_refresh_date'])
