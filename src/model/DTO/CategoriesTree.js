import Category from './Category';
import CategoryGroup from './CategoryGroup';
import CategorySubgroup from './CategorySubgroup';

export default class CategoriesTree {
    constructor({ Categories, Groups, SubGroups }) {
        this.categories = Categories.map(c => new Category(c));
        this.categoryGroups = Groups.map(c => new CategoryGroup(c));
        this.categorySubgroups = SubGroups.map(c => new CategorySubgroup(c));
    }

    /**
     * Возвращает массив подгрупп группы каталога
     * @param {CategoryGroup} group
     */
    getSubgroups(group) {
        return this.categorySubgroups.filter(
            c => c.groupId === group.id // && group.subgroupIds.indexOf(c.id) >= 0
        );
    }

    /**
     * Возвращает массив категорий подгруппы каталога
     * @param {CategorySubgroup} subgroup
     */
    getCategories(subgroup) {
        return this.categories.filter(
            c => subgroup.categoryIds.indexOf(c.id) >= 0
        );
    }

    /**
     * Возвращает массив id элементов по иерархии каталога
     * @param {number} categoryId
     * @returns {[number, number, number]}
     */
    getFullPath(categoryId) {
        var subgroupId = categoryId
            ? this.categorySubgroups
                  .filter(c => c.categoryIds.indexOf(categoryId) >= 0)
                  .map(c => c.id)[0]
            : null;
        var groupId = subgroupId
            ? this.categoryGroups
                  .filter(c => c.subgroupIds.indexOf(subgroupId) >= 0)
                  .map(c => c.id)[0]
            : null;

        return [groupId, subgroupId, categoryId];
    }
}
