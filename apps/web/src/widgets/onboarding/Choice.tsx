import type { ReactNode } from "react";

export type ChoiceProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
};

function Tick() {
  return (
    <span className="choice-tick" aria-hidden="true">
      ✓
    </span>
  );
}

export function Choice({ selected, onClick, children }: ChoiceProps) {
  let className = "onboarding-choice";

  if (selected) {
    className += " selected";
  }
  return (
    <button type="button" className={className} onClick={onClick} aria-pressed={selected}>
      <span>{children}</span>
      <Tick />
    </button>
  );
}
