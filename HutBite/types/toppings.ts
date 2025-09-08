import { OptionListIDs } from './productOptions';

// Interface for topping group
export interface IToppingGroup {
    CatID: string;
    DeProducts: ITopping[];
    Description: string;
    DisplyAble: boolean;
    GrpType: string;
    ID: string;
    Name: string;
}

export interface ITopping {
    CatID: string;
    GrpID: string;
    ID: string;
    Name: string;
    Org: boolean;
    OrgPortion: number;
    Portion: number;
    Shorty: string;
    Sides: any[];
    DeGroupedPrices?: IDeGroupedPrices;
    ImgUrl: string | null;
    isActive: boolean;
    DisplayGrp: string;
    isOneChoice: boolean;
    DePrice: number;
}

/**
 * Matches API's DeGroupedPrices structure
 */
export interface IDeGroupedPrices {
    DePrices: IToppingPrice[];
    ID: string;
    Mandetory: boolean;
}

/**
 * Represents a single price entry for a topping, extracted frorm DePrices in the API
 */
export interface IToppingPrice {
    Amount: number;
    DeMixOption: IDeMixOption;
    OnlineName: string;
    ImgSrc: string;
    IsOptionMandatory: boolean;
    OPID: string;
}

/**
 * Represents the DeMixOption structure inside a topping price
 */
export interface IDeMixOption {
    DeSideDef: any | null;
    DeSideDefID: any | null;
    ID: string;
    Name: string;
    OptionList: IOptionListEntry[];
    OptionListIDs: OptionListIDs;
    Serve: string;
}

/**
 * Represents an entry inside the OptionList array
 */
export interface IOptionListEntry {
    Key: string;
    Value: ISizeDetails;
}

/**
 * Represents the available size details in OptionList
 */
export interface ISizeDetails {
    GrpID: string;
    ID: string;
    ImgSrc: string;
    ModifierOrder: number;
    Name: string;
    OnlineName: string;
    UIEID: string;
}

/**
 * Interface representing a selected topping with portion count
 */
export interface IToppingSelection {
    id: string;
    name: string;  // Topping name
    portions: number;
}

/**
 * Interface for topping selection validation state
 */
export interface IToppingValidationState {
    isValid: boolean;
    errorMessage?: string;
    invalidSelections: string[];
}
