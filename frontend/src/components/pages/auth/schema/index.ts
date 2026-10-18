import * as yup from 'yup'

// Schema לולידציה
const signupSchema = yup.object({
  username: yup.string().min(2, 'Username must be at least 2 characters').required('Required field'),
  email: yup.string().email('Invalid email address').required('Required field'),
  password: yup.string().min(8, 'Ensure this field has at least 8 characters').required('Required field'),
  password_confirm: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Required field'),
})

const signinSchema = yup.object({
  username: yup
    .string()
    .required('Required field')
    .test('valid-username-or-email', 'Username must contain only English letters and numbers', function(value) {
      if (!value) return false;
      // אם נראה כמו email (יש @), מאפשרים אותו
      if (value.includes('@')) return true;
      // אחרת בודקים שזה username חוקי - רק אותיות באנגלית ומספרים
      return /^[a-zA-Z0-9]+$/.test(value);
    }),
  password: yup.string().required('Required field'),
})

const forgotPasswordSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Required field'),
})

const resetPasswordSchema = yup.object({
  password: yup.string().min(8, 'Ensure this field has at least 8 characters').required('Required field'),
  password_confirm: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Required field'),
  uid: yup.string().required('Required field'),
  token: yup.string().required('Required field'),
})

const verifyEmailSchema = yup.object({
  key: yup.string().required('Required field'),
})

export { 
  signupSchema, 
  signinSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  verifyEmailSchema 
}