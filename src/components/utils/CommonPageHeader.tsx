import React from 'react';
import './CommonPageHeader.scss';

/**
 * Props for the CommonPageHeader component
 */
interface CommonPageHeaderProps {
    /**
     * The component to show on the right hand side of the header
     */
    rightNode?: React.ReactNode,
}

/**
 * The header for the common page layout
 * @constructor
 */
const CommonPageHeader: React.FunctionComponent<CommonPageHeaderProps> = (props: CommonPageHeaderProps) => {
    return (
        <div className={'common-page-header'}>
            <h1>Quantalk</h1>
            {props.rightNode}
        </div>
    );
};

export default CommonPageHeader;
