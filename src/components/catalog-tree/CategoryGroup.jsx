import React from 'react';
import PropTypes from 'prop-types';
import CategorySubgroup from './CategorySubgroup';
import toggling from './hoc/toggling';

function CategoryGroup({
    group,
    toggle,
    isActive,
    activeSubgroupId,
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
                        href={`#${group.toString()}`}
                        className={linkClass}
                        onClick={onClick}
                    >
                        {group.toString()}
                    </a>
                </figcaption>
                {isActive ? (
                    <ul>
                        {vehicleCategoriesTree.getSubgroups(group).map((g) => (
                            <CategorySubgroup
                                key={`ctg_${group.id}:${g.id}`}
                                group={group}
                                subgroup={g}
                                onCategoryClick={onCategoryClick}
                                isActive={g.id == activeSubgroupId}
                                activeCategoryId={activeCategoryId}
                                vehicleCategoriesTree={vehicleCategoriesTree}
                            />
                        ))}
                    </ul>
                ) : null}
            </figure>
        </li>
    );
}

CategoryGroup.propTypes = {
    group: PropTypes.object.isRequired,
    toggle: PropTypes.func.isRequired,
    isActive: PropTypes.bool,
    activeSubgroupId: PropTypes.number,
    activeCategoryId: PropTypes.number
};

CategoryGroup.defaultProps = {
    isActive: false,
    activeSubgroupId: 0,
    activeCategoryId: 0
};

export default toggling(CategoryGroup);
