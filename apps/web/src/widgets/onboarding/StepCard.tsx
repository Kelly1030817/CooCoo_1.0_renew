import type { ReactNode } from "react";

export type StepCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function StepCard({ title, description, children, className = "" }: StepCardProps) {
  return (
    <section className={`onboarding-step-card ${className}`}>
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}
