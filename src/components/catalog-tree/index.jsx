import React from 'react';
import PropTypes from 'prop-types';
import CategoryGroup from './CategoryGroup';
import './styles.css';

export default function CatalogTree({
    activeCategory,
    vehicleCategoriesTree,
    onCategoryClick
}) {
    if (vehicleCategoriesTree) {
        const activeCategoryPath = vehicleCategoriesTree.getFullPath(
            activeCategory && activeCategory.id
        );
        return (
            <ul role="tree" className="ctgtree">
                {vehicleCategoriesTree.categoryGroups.map((g) => (
                    <CategoryGroup
                        key={`ctg_${g.id}`}
                        group={g}
                        vehicleCategoriesTree={vehicleCategoriesTree}
                        onCategoryClick={onCategoryClick}
                        isActive={g.id == activeCategoryPath[0]}
                        activeSubgroupId={activeCategoryPath[1]}
                        activeCategoryId={activeCategoryPath[2]}
                    />
                ))}
            </ul>
        );
    } else return null;
}
