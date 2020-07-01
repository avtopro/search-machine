import React from 'react';
import PropTypes from 'prop-types';
import CategoryResult from './CategoryResult';
import toggling from './hoc/toggling';

function CategorySubgroup({
    group,
    subgroup,
    toggle,
    isActive,
    activeCategoryId,
    vehicleCategoriesTree,
    onCategoryClick
}) {
    const linkClass = `ctgtree__link ctgtree__link--${
        isActive ? 'minus' : 'plus'
    }`;

    const onClick = (e) => {
        e.preventDefault();
        toggle();
    };

    if (!vehicleCategoriesTree) return null;

    return (
        <li>
            <figure>
                <figcaption>
                    <a
                        href={`#${subgroup.toString()}`}
                        className={linkClass}
                        onClick={onClick}
                    >
                        {subgroup.toString()}
                    </a>
                </figcaption>
                {isActive ? (
                    <ul>
                        {vehicleCategoriesTree
                            .getCategories(subgroup)
                            .map((c) => (
                                <CategoryResult
                                    key={`ctg_${group.id}:${subgroup.id}:${c.id}`}
                                    category={c}
                                    onCategoryClick={onCategoryClick}
                                    isActive={c.id == activeCategoryId}
                                />
                            ))}
                    </ul>
                ) : null}
            </figure>
        </li>
    );
}

CategorySubgroup.propTypes = {
    group: PropTypes.object.isRequired,
    subgroup: PropTypes.object.isRequired,
    toggle: PropTypes.func.isRequired,
    isActive: PropTypes.bool,
    activeCategoryId: PropTypes.number
};

CategorySubgroup.defaultProps = {
    isActive: false,
    activeCategoryId: 0
};

export default toggling(CategorySubgroup);
