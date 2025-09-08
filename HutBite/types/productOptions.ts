/**
 * Base interface for individual product option values
 */
export interface IProductOptionValue {
  GrpID: string;
  ID: string;
  ImgSrc: string;
  Description?: string;
  ImgUrl?: string;
  ImgUrl2?: string;
  IsActive?: boolean;
  ModifierOrder: number;
  Name: string;
  OnlineName: string;
  UIEID: string;
}

/**
 * Interface for product option with key-value structure
 */
export interface IProductOption {
  Key: string;
  Value: IProductOptionValue;
}

/**
 * Interface for option list ID reference
 */
export interface IOptionListID {
  Key: string;
  Value: string;
}

/**
 * OptionListIDs from the API may also come as a dictionary object.
 */
export type OptionListIDs = IOptionListID[] | { [key: string]: string };

/**
 * Type for grouped product options by category
 */
export interface IProductOptionGroup {
  key: string;
  isRequired: boolean;
  options: IProductOptionValue[];
}

/**
 * Type for mapping options categories to their selected values
 */
export interface IOptionSelections {
  [key: string]: string | null; // Option category to selected option ID
}

/**
 * Interface for option validation state
 */
export interface IOptionValidationState {
  isValid: boolean;
  missingRequired: string[];
  invalidCombinations?: string[];
}

/**
 * Type for option requirement configuration
 */
export interface IOptionRequirements {
  mandatoryKeys: string[];
  allowedCombinations?: {
    [key: string]: string[];
  };
}

/**
 * Interface for option compatibility mapping
 * Maps option keys to their values, then to other option keys and their compatible values
 */
export interface IOptionCompatibilityMap {
  [optionKey: string]: {
    [optionValue: string]: {
      [otherOptionsKey: string]: Set<string>;
    };
  };
}

/**
 * Interface for filtered option groups
 * Maps group keys to arrays of compatible option values
 */
export interface IFilteredOptionGroups {
  [groupKey: string]: IProductOptionValue[];
}

/**
 * Type for processed product options data
 */
export interface IProcessedProductOptions {
  groups: IProductOptionGroup[];
  requirements: IOptionRequirements;
  defaultSelections?: IOptionSelections;
  validCombinations?: IOptionCompatibilityMap;
}
