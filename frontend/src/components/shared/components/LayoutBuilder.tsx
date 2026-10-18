interface LayoutBuilderProps {
  children: React.ReactNode;
}

export const LayoutBuilder = ({ children }: LayoutBuilderProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {children}
    </div>
  );
};

