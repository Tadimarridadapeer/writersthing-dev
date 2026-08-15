import * as React from'react';
import { Hr } from'@react-email/components'; interface DividerProps { dashed?: boolean;
} export const Divider = ({ dashed = false }: DividerProps) => { return ( <Hr className={`${dashed ?'border-dashed border-gray-300' :'border-solid border-gray-200'} my-[20px] mx-0 w-full`} /> );
}; export default Divider;
