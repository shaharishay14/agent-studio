// Title + one line of help at the top of each trigger step
function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <h3 className="m-0 text-[17px] font-semibold text-white">{title}</h3>
      <p className="m-0 text-sm text-white/66">{subtitle}</p>
    </div>
  );
}

export default StepHeading;
