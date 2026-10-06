import React from "react";
import ShipmentPage from "./shipmentpage";

export const PublicShipmentPage: React.FC = () => {
	return <ShipmentPage isPublicMode={true} />;
};

export default PublicShipmentPage;
