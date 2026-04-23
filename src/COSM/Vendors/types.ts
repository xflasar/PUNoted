/**
 * Represents a material in the game.
 */
export interface Material {
    /** Unique identifier for the material */
    materialid: string;
    /** Short ticker symbol for the material */
    ticker: string;
    /** The ask price of the material */
    askprice: number;
    /** The available quantity of the material */
    quantity: number;
}

/**
 * Represents a location in the game where materials are stored or traded.
 */
export interface Location {
    /** Unique identifier for the location */
    id: string;
    /** Full name of the location */
    location_name: string;
    /** Short code for the location */
    location_code: string;
    /** The amount available at this location */
    amount: number;
    /** The maximum storage capacity or stored amount at this location */
    storage_amount: number;
}

/**
 * Represents the pricing details for an item.
 */
export interface ItemPrice {
    /** Fixed price set by the vendor */
    fixedprice: number;
    /** Price specifically for corporation members */
    corpprice: number;
    /** Price at the Commodity Exchange (CX) */
    cxprice: number;
}

/**
 * Represents an order item within a vendor store.
 */
export interface OrderItem {
    /** Unique identifier for the order (optional for new orders) */
    orderid?: string;
    /** Unique identifier for the material */
    materialid: string;
    /** Short ticker symbol for the material */
    materialticker: string;
    /** Type of order: buy or sell */
    ordertype?: "buy" | "sell" | undefined;
    /** List of locations associated with this order */
    location: Location[];
    /** Pricing information for the order */
    price: ItemPrice;
    /** Total quantity for the order */
    quantity: number;
    /** Optional identifier used on the frontend for tracking */
    frontendId?: string;
    /** Indicates if the order item is disabled in the UI */
    isDisabled?: boolean;
    /** Name of the vendor */
    vendorname: string;
    /** Name of the game context */
    gamename: string;
    /** Unique identifier for the vendor */
    vendorid: string;
    /** Amount of material reserved */
    reserved: number;
    /** Amount of material currently in store */
    instore: number;
}

/**
 * Represents a vendor's store, containing vendor details and their orders.
 */
export interface VendorStore {
    /** Details about the vendor */
    vendor: {
        /** Unique identifier for the vendor */
        vendorid: string;
        /** The company code of the vendor */
        companycode: string;
        /** The full company name of the vendor */
        companyname: string;
        /** The corporation name the vendor belongs to */
        corpname: string;
        /** The game context name */
        gamename: string;
        /** Indicates if the vendor is currently active */
        isactive: boolean;
        /** The default Commodity Exchange (CX) for the vendor */
        cx: string;
    };
    /** List of orders managed by this vendor */
    orders: OrderItem[];
}
