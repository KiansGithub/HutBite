import type { IBaseProduct, MenuCategory, MenuGroup } from "@/types/store";

/**
 * Names used to identify offer/deal categoires. Case-insensitive.
 */
export const OFFER_CATEGORY_NAMES = ["offers", "offer", "angebote", "deals"];


export function filterVisibleMenuCategories(categories: MenuCategory[]): MenuCategory[] {
    const blockedNames: string[] = [];

    return categories.filter(cat => {
        const name = cat?.Name?.toLowerCase()?.trim();
        return name && !blockedNames.includes(name);
    });
}

/**
 * Checks if a category is an offer/deal category.
 */
export function isOfferCategory(category: MenuCategory): boolean {
    const name = category?.Name?.toLowerCase()?.trim();
    return !!name && OFFER_CATEGORY_NAMES.includes(name);
}

/**
 * Filters out offer/deal categories from a list of categories.
 * Useful for the main menu display. 
 */
export function filterOutOfferCategories(categories: MenuCategory[]): MenuCategory[] {
    return categories.filter(cat => !isOfferCategory(cat));
}

/**
 * Filters out hideen product groups like bundle deals, specials, etc. 
 */
export function filterVisibleProductGroups(groups: MenuGroup[]): MenuGroup[] {
    const blockedGroupNames = ["quattro", "angebote"];

    return groups.filter(group => {
        const name = group?.Name?.toLowerCase()?.trim();
        return name && !blockedGroupNames.includes(name);
    });
}

/**
 * Filters out hidden products from specific groups
 */
export function filterVisibleProducts(products: IBaseProduct[]): IBaseProduct[] {
    const blockedKeywords = ["angebot", "deal", "family", "picasso", "halfnhalf", "quattro", "quattro spezial"];

    return products.filter(product => {
        const name = product?.Name?.toLowerCase()?.trim();
        return name && !blockedKeywords.some(keyword => name.includes(keyword));
    })
}