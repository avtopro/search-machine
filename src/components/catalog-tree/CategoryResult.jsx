import React from 'react';
import PropTypes from 'prop-types';

export default class CategoryResult extends React.Component {
    onClick = (e) => {
        const { category, onCategoryClick } = this.props;
        onCategoryClick(e, category);
    };

    render() {
        const { category, isActive } = this.props;

        const linkClassName = `ctgtree__link${
            isActive ? ' ctgtree__link--active' : ''
        }`;

        return (
            <li>
                <a
                    href={category.uri}
                    className={linkClassName}
                    onClick={this.onClick}
                >
                    {category.toString()}
                </a>
            </li>
        );
    }
}

CategoryResult.propTypes = {
    category: PropTypes.object.isRequired,
    isActive: PropTypes.bool
};

CategoryResult.defaultProps = {
    isActive: false
};
