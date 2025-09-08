import { ITopping } from './toppings';
import { OptionListIDs } from './productOptions';

/**
 * Base interface for product options like size and crust
 */
export interface IProductOption {
  GrpID: string;
  ID: string;
  ImgSrc: string;
  ModifierOrder: number;
  Name: string;
  OnlineName: string;
  UIEID: string;
}

/**
 * Interface for product pricing policies
 */
export interface IProductPolicy {
  CatID: string;
  Description: string | null;
  Extra: number;
  ID: string;
  Value: number;
}

/**
 * Interface for side definitions in product options
 */
export interface ISideDef {
  ID: string;
  ImageSource: string | null;
  Number: number;
  Policys: IProductPolicy[];
}

/**
 * Interface for mix options in product pricing
 */
export interface IMixOption {
  DeSideDef: ISideDef;
  DeSideDefID: string;
  ID: string;
  Name: string;
  OptionList?: Array<{
    Key: string;
    Value: IProductOption;
  }>;
  OptionListIDs?: OptionListIDs;
  Serve: string;
}

/**
 * Interface for product pricing information
 */
export interface IProductPrice {
  Amount: number;
  DeMixOption?: IMixOption;
  GrpID: string;
  IsOptionMandetory: boolean;
  OPID: string;
  quantity?: number;
  serve?: string | null;
}

/**
 * Interface for grouped prices
 */
export interface IGroupedPrices {
  DePrices: IProductPrice[];
  ID: string;
  Mandetory: boolean;
}

/**
 * Interface for product option list entry
 */
export interface IProductOptionListEntry {
  Key: string;
  Value: IProductOption;
  IsRequired?: boolean;
  AllowedValues?: string[];
}

/**
 * Base interface for common product properties
 */
export interface IBaseProduct {
  ID: string;
  Name: string;
  Description: string;
  ImgUrl: string;
  ImgUrl2: string;
  IsActive: boolean;

  // Category and group associations
  GrpID: string;
  CatID?: string;

  //Topping info
  ToppingGrpID?: string;
  Toppings?: ITopping[];

  // Price information
  DePrice: number;
  DeGroupPriceID?: string;
  DeGroupedPrices?: IGroupedPrices;
  Min4DLV?: number;

  // Option configuration
  DeOptionList?: IProductOptionListEntry[];
  IsOptionMandetory: boolean;
  OptionListIDs?: OptionListIDs;

  // Product flags
  CanBeOnHnH?: boolean;
  CanHvItem?: boolean;
  CanNotBeFree: boolean;
  CreateYourOwn: boolean;
  IsFreeChoice: boolean;
  IsNew: boolean;
  Modifiable: boolean;
  SoloInStore: boolean;
  isHalfandHalf: boolean;

  // Additional metadata
  VAT: string;
  VATRATE: number;
  ViewOrder: number;
  PrepTableID?: string;
  PrinterID?: string;
  Pritable: boolean;
  ServiceTime: number;
}
