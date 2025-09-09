import { ITopping } from '@/types/toppings';
 
export interface IToppingGroupInfo {
    order: number;
    displayName: string;
    originalGroup: string;
    isOneChoice: boolean; 
}
 
export interface IGroupedToppings {
    groupInfo: IToppingGroupInfo;
    toppings: ITopping[];
}
 
/**
 * Parse DisplayGrp to extract order number and display name
 * Example: "2Soßen" -> { order: 2, displayName: "Soßen", originalGroup: "2Soßen" }
 */
export const parseDisplayGroup = (displayGrp: string, toppings: ITopping[]): IToppingGroupInfo => {
    const match = displayGrp.match(/^(\d+)(.+)$/);

    // Chec if any topping in this group has OneChice set to true 
    const isOneChoice = toppings.some(topping => topping.OneChice === true);
 
    if (match) {
        return {
            order: parseInt(match[1], 10),
            displayName: match[2],
            originalGroup: displayGrp, 
            isOneChoice
        };
    }
 
    // Fallback for groups without number prefix
    return {
        order: 999,
        displayName: displayGrp,
        originalGroup: displayGrp, 
        isOneChoice
    };
};
 
/**
 * Group toppings by their DisplayGrp and sort by order
 */
export const groupToppingsByDisplayGroup = (toppings: ITopping[]): IGroupedToppings[] => {
    const groupMap = new Map<string, ITopping[]>();
 
    // Group toppings by DisplayGrp
    toppings.forEach(topping => {
        const displayGrp = topping.DisplayGrp || 'Other';
        if (!groupMap.has(displayGrp)) {
            groupMap.set(displayGrp, []);
        }
        groupMap.get(displayGrp)!.push(topping);
    });
 
    // Convert to array and sort by order
    const groupedToppings: IGroupedToppings[] = Array.from(groupMap.entries()).map(([groupKey, groupToppings]) => ({
        groupInfo: parseDisplayGroup(groupKey, groupToppings),
        toppings: groupToppings
    }));
 
    // Sort by order number
    groupedToppings.sort((a, b) => a.groupInfo.order - b.groupInfo.order);
 
    return groupedToppings;
};