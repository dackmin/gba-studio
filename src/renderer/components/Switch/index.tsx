import { Children } from 'react';

import type { CaseNode } from './Case';
import Case from './Case';

interface SwitchProps {
  value: string | number;
  children: CaseNode | CaseNode[];
}

const Switch = ({ value, children }: SwitchProps) => {
  const childrenArr = Children.toArray(children) as CaseNode[];

  return childrenArr
    .find((child: CaseNode) =>
      Array.isArray(child.props.value)
        ? child.props.value.includes(value)
        : child.props.value === value
    ) ||
    childrenArr.find((child: CaseNode) => child.props.default) ||
    null;
};

Switch.Case = Case;

export default Switch;

export { Case };
