/* eslint-disable @stylistic/max-len */

import { ComponentPropsWithoutRef } from 'react';

const BottomBarIcon = (props: ComponentPropsWithoutRef<'svg'>) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" { ...props }>
    <path fillRule="evenodd" clipRule="evenodd" d="M1.5 1H13.5C13.7761 1 14 1.22386 14 1.5V6H1V1.5C1 1.22386 1.22386 1 1.5 1ZM1 7V11.5C1 11.7761 1.22386 12 1.5 12H13.5C13.7761 12 14 11.7761 14 11.5V7H1ZM0 1.5C0 0.67157 0.671573 0 1.5 0H13.5C14.3284 0 15 0.67157 15 1.5V11.5C15 12.3284 14.3284 13 13.5 13H1.5C0.671573 13 0 12.3284 0 11.5V1.5Z" fill="currentColor"/>
    <path d="M1 7V11.5C1 11.7761 1.22386 12 1.5 12H13.5C13.7761 12 14 11.7761 14 11.5V7H1Z" fill="currentColor"/>
  </svg>
);

export default BottomBarIcon;
