import React, { useEffect, useState } from "react";
import {
	Typography,
	Box,
	Paper,
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Button,
	Modal,
	TextField,
	MenuItem,
	Chip,
} from "@mui/material";
import {
	CalendarPlus
} from "lucide-react";
import { addDays } from "date-fns";
import { ShipOrders } from "./ShipOrders";

interface Part {
	name: string;
	quantity: number;
}

interface ShipType {
	id: string;
	name: string;
	parts: Part[];
	price: number;
	priceCorp: number;
}

interface ShipOrder {
	processedParts: Part[];
	id: number;
	customer: string;
	shipType: ShipType;
	price: number;
	creationDate: Date;
	waitTimeDays: number;
	completionDate: Date;
	status: "Pending" | "In Progress" | "Completed";
	notes?: string;
}

const PartsFilter = [
	"MSL",
	"FFC",
	"LHP",
	"CQL",
	"QCR",
	"WCB",
	"LFL",
	"HCB",
	"BR1",
	"SFE",
	"MFE",
	"SSC",
	"LFE",
	"FSE",
	"CQM",
	"LCB",
	"VCB",
	"CQS",
	"BRS",
	"SSL",
];

const MOCK_SHIP_TYPES: ShipType[] = [
	{
		id: "all",
		name: "All Ship Types",
		parts: [] as Part[],
		price: 0,
		priceCorp: 0,
	},
	{
		id: "lcbftl",
		name: "LCB FTL",
		parts: [
			{ name: "BR1", quantity: 1 },
			{ name: "CQM", quantity: 1 },
			{ name: "FFC", quantity: 1 },
			{ name: "FSE", quantity: 1 },
			{ name: "LCB", quantity: 1 },
			{ name: "LFE", quantity: 2 },
			{ name: "LFL", quantity: 1 },
			{ name: "LHP", quantity: 94 },
			{ name: "MFE", quantity: 2 },
			{ name: "MSL", quantity: 1 },
			{ name: "QCR", quantity: 1 },
			{ name: "SFE", quantity: 1 },
			{ name: "SSC", quantity: 128 },
		],
		price: 4900000,
		priceCorp: 3049837,
	},
	{
		id: "lcbstl",
		name: "LCB STL",
		parts: [
			{ name: "BRS", quantity: 1 },
			{ name: "CQM", quantity: 1 },
			{ name: "FSE", quantity: 1 },
			{ name: "LCB", quantity: 1 },
			{ name: "LHP", quantity: 87 },
			{ name: "SSC", quantity: 115 },
			{ name: "SSL", quantity: 1 },
		],
		price: 2800000,
		priceCorp: 1878140,
	},
	{
		id: "wcbftl",
		name: "WCB FTL",
		parts: [
			{ name: "BR1", quantity: 1 },
			{ name: "CQS", quantity: 1 },
			{ name: "FFC", quantity: 1 },
			{ name: "FSE", quantity: 1 },
			{ name: "WCB", quantity: 1 },
			{ name: "LFE", quantity: 1 },
			{ name: "LFL", quantity: 1 },
			{ name: "LHP", quantity: 68 },
			{ name: "MFE", quantity: 2 },
			{ name: "MSL", quantity: 1 },
			{ name: "QCR", quantity: 1 },
			{ name: "SFE", quantity: 1 },
			{ name: "SSC", quantity: 78 },
		],
		price: 4450000,
		priceCorp: 2763265,
	},
	{
		id: "wcbstl",
		name: "WCB STL",
		parts: [
			{ name: "BRS", quantity: 1 },
			{ name: "CQS", quantity: 1 },
			{ name: "FSE", quantity: 1 },
			{ name: "WCB", quantity: 1 },
			{ name: "LHP", quantity: 60 },
			{ name: "SSC", quantity: 65 },
			{ name: "SSL", quantity: 1 },
		],
		price: 2500000,
		priceCorp: 1667444,
	},
	{
		id: "vcbftl",
		name: "VCB FTL",
		parts: [
			{ name: "BR1", quantity: 1 },
			{ name: "CQL", quantity: 1 },
			{ name: "FFC", quantity: 1 },
			{ name: "FSE", quantity: 1 },
			{ name: "VCB", quantity: 1 },
			{ name: "LFE", quantity: 3 },
			{ name: "LFL", quantity: 1 },
			{ name: "LHP", quantity: 117 },
			{ name: "MFE", quantity: 2 },
			{ name: "MSL", quantity: 1 },
			{ name: "QCR", quantity: 1 },
			{ name: "SFE", quantity: 1 },
			{ name: "SSC", quantity: 178 },
		],
		price: 5400000,
		priceCorp: 3361006,
	},
	{
		id: "hcbftl",
		name: "HCB FTL",
		parts: [
			{ name: "BR1", quantity: 1 },
			{ name: "CQL", quantity: 1 },
			{ name: "FFC", quantity: 1 },
			{ name: "FSE", quantity: 1 },
			{ name: "HCB", quantity: 1 },
			{ name: "LFE", quantity: 5 },
			{ name: "LFL", quantity: 1 },
			{ name: "LHP", quantity: 157 },
			{ name: "MFE", quantity: 2 },
			{ name: "MSL", quantity: 1 },
			{ name: "QCR", quantity: 1 },
			{ name: "SFE", quantity: 1 },
			{ name: "SSC", quantity: 278 },
		],
		price: 9000000,
		priceCorp: 4735092,
	},
	{
		id: "starterupgrade",
		name: "WCB Starter Upgrade",
		parts: [
			{ name: "BR1", quantity: 1 },
			{ name: "CQS", quantity: 1 },
			{ name: "FFC", quantity: 1 },
			{ name: "LFE", quantity: 1 },
			{ name: "LHP", quantity: 68 },
			{ name: "MFE", quantity: 2 },
			{ name: "MSL", quantity: 1 },
			{ name: "RCT", quantity: 1 },
			{ name: "SFE", quantity: 1 },
			{ name: "SSC", quantity: 78 },
			{ name: "WCB", quantity: 1 },
		],
		price: 950000,
		priceCorp: 708616,
	},
];

const calculateTotalParts = (orders: ShipOrder[]) => {
	const totalParts: { [key: string]: number } = {};
	orders
		.filter((order) => order.status === "In Progress")
		.forEach((order) => {
			order.shipType.parts.forEach((part) => {
				if (PartsFilter.includes(part.name)) {
					totalParts[part.name] = (totalParts[part.name] || 0) + part.quantity;
				}
			});
		});
	return Object.entries(totalParts).map(([name, quantity]) => ({
		name,
		quantity,
	}));
};

/* const getNextShipParts = (orders: ShipOrder[]) => {
	const nextPendingOrder = orders
		.filter((order) => order.status === "In Progress")
		.sort((a, b) => a.creationDate.getTime() - b.creationDate.getTime())[0];

	return nextPendingOrder ? nextPendingOrder.shipType.parts : [];
}; */

const getAllUniquePartNames = (orders: ShipOrder[]) => {
	const allParts = new Set<string>();
	orders.forEach((order) => {
		order.shipType.parts.forEach((part) => {
			if (PartsFilter.includes(part.name)) {
				allParts.add(part.name);
			}
		});
	});
	return Array.from(allParts).sort();
};

const ProductionDashboard = ({ isMobile }: { isMobile: boolean }) => {
	const [shipOrders, setShipOrders] = useState<ShipOrder[]>([]);
	const [storageItems, setStorageItems] = useState<Part[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedShipTypes, setSelectedShipTypes] = useState<string[]>(["all"]);

	const [newOrder, setNewOrder] = useState({
		customer: "",
		shipTypeId: MOCK_SHIP_TYPES[0].id,
		price: "",
		waitTime: "",
		notes: "",
	});

	const fetchShipProduction = async () => {
		try {
			const response = await fetch(
				"https://punoted.ddns.net/api/ship_production"
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const apiResponse = await response.json();

			if (apiResponse.success && Array.isArray(apiResponse.data.shiporders) && Array.isArray(apiResponse.data.storageitems)) {
				const fetchedOrders: ShipOrder[] = apiResponse.data.shiporders.map((item: any) => {
					const shipType = MOCK_SHIP_TYPES.find(
						(st) => st.id === item.shiptype
					);

					if (!shipType) {
						console.warn(
							`ShipType "${item.shiptype}" not found in MOCK_SHIP_TYPES. Using "all" as default.`
						);
						return {
							id: item.orderid,
							customer: item.username,
							shipType: MOCK_SHIP_TYPES[0],
							price: item.price,
							creationDate: new Date(item.orderdate),
							waitTimeDays: item.orderwaittime,
							completionDate: addDays(
								new Date(item.orderdate),
								item.orderwaittime
							),
							status: item.completed ? "Completed" : "In Progress",
							notes: item.notes,
						};
					}

					return {
						id: item.orderid,
						customer: item.username,
						shipType: shipType,
						price: item.price,
						creationDate: new Date(item.orderdate),
						waitTimeDays: item.orderwaittime,
						completionDate: addDays(
							new Date(item.orderdate),
							item.orderwaittime
						),
						status: item.completed ? "Completed" : "In Progress",
						notes: item.notes,
					};
				});
				const fetchedStorageItems: Part[] = apiResponse.data.storageitems.map((item: any) => {
					return {
						'name': item.ticker,
						'quantity': item.quantity
					}
				})
				setShipOrders(fetchedOrders);
				setStorageItems(fetchedStorageItems)
			} else {
				console.error(
					"API response indicates failure or data is not an array:",
					apiResponse
				);
			}
		} catch (error) {
			console.error("Failed to fetch ship production data:", error);
		}
	};

	useEffect(() => {
		fetchShipProduction();
	}, []);

	const handleOpenModal = () => setIsModalOpen(true);
	const handleCloseModal = () => setIsModalOpen(false);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setNewOrder((prev) => ({ ...prev, [name]: value }));
	};

	const handleAddOrder = () => {
		const { customer, shipTypeId, price, waitTime, notes } = newOrder;
		if (!customer || !shipTypeId || !price || !waitTime) {
			return;
		}

		const shipType = MOCK_SHIP_TYPES.find((ship) => ship.id === shipTypeId);
		if (!shipType) {
			return;
		}

		const creationDate = new Date();
		const waitTimeDays = parseFloat(waitTime);
		const completionDate = addDays(creationDate, waitTimeDays);
		const newId = `ord${shipOrders.length + 1}`;

		const newShipOrder: ShipOrder = {
			id: Number(newId),
			processedParts: [],
			customer,
			shipType,
			price: parseFloat(price),
			creationDate,
			waitTimeDays,
			completionDate,
			status: "Pending",
			notes,
		};

		setShipOrders((prev) => [...prev, newShipOrder]);
		setNewOrder({
			customer: "",
			shipTypeId: MOCK_SHIP_TYPES[0].id,
			price: "",
			waitTime: "",
			notes: "",
		});
		handleCloseModal();
	};

	const handleFilterClick = (shipId: string) => {
		setSelectedShipTypes((prevSelected) => {
			if (shipId === "all") {
				return ["all"];
			}

			const isCurrentlyAll = prevSelected.includes("all");
			const isCurrentlySelected = prevSelected.includes(shipId);

			if (isCurrentlySelected) {
				const newSelection = prevSelected.filter((id) => id !== shipId);
				return newSelection.length === 0 ? ["all"] : newSelection;
			} else {
				const newSelection = isCurrentlyAll
					? [shipId]
					: [...prevSelected, shipId];
				return newSelection;
			}
		});
	};

	const processOrdersAndParts = (orders: ShipOrder[]) => {
		const availableParts = new Map(
			storageItems.map((p) => [p.name, p.quantity])
		);
		
		const processedOrders = orders.map((order) => {
			const processedOrder = { ...order, processedParts: [] as any[] };
			if (order.status === "In Progress") {
				const partsStatus = order.shipType.parts
					.filter((part) => PartsFilter.includes(part.name))
					.map((part) => {
						const available = availableParts.get(part.name) || 0;
						const hasEnough = available >= part.quantity;

						if (hasEnough) {
							availableParts.set(part.name, available - part.quantity);
						}

						return {
							...part,
							isAvailable: hasEnough,
						};
					});
				processedOrder.processedParts = partsStatus;
			}
			return processedOrder;
		});
		console.log(processedOrders)
		return processedOrders;
	};

	const summaryOrders = selectedShipTypes.includes("all")
		? shipOrders
		: shipOrders.filter((order) =>
				selectedShipTypes.includes(order.shipType.id)
		  );

	const getSummaryDataWithAvailability = (orders: ShipOrder[]) => {
		const inProgressOrders = orders
			.filter((order) => order.status === "In Progress")
			.sort((a: ShipOrder, b: ShipOrder) => Number(a.id) - Number(b.id));
		//.sort((a, b) => a.creationDate.getTime() - b.creationDate.getTime());

		const availableParts = new Map(
			storageItems.map((p) => [p.name, p.quantity])
		);

		const allParts = new Set<string>();
		inProgressOrders.forEach((order) => {
			order.shipType.parts
				.filter((part) => PartsFilter.includes(part.name))
				.forEach((part) => allParts.add(part.name));
		});
		const partNames = Array.from(allParts).sort();

		const summaryData = inProgressOrders.map((order) => {
			const partsMap = new Map(
				order.shipType.parts.map((p) => [p.name, p.quantity])
			);
			const row: {
				[key: string]: { value: number; isAvailable: boolean } | string;
			} = {
				combinedHeader: `${order.shipType.name} (${order.customer})`,
			};

			partNames.forEach((partName) => {
				const requiredQuantity = partsMap.get(partName) || 0;
				const availableQuantity = availableParts.get(partName) || 0;
				let isAvailable = false;
				if (availableQuantity >= requiredQuantity) {
					if (availableQuantity === 0) {
						isAvailable = false;
					} else {
						isAvailable = availableQuantity >= requiredQuantity;
					}
				}

				if (isAvailable) {
					availableParts.set(partName, availableQuantity - requiredQuantity);
				}

				row[partName] = {
					value: requiredQuantity,
					isAvailable: isAvailable,
				};
			});
			return row;
		});

		return { partNames, summaryData };
	};

	const sortedOrders = [...shipOrders].sort(
		(a, b) => a.creationDate.getTime() - b.creationDate.getTime()
	);
	const processedOrders: ShipOrder[] = processOrdersAndParts(sortedOrders);
	const { partNames, summaryData } =
		getSummaryDataWithAvailability(summaryOrders);

	const totalParts = calculateTotalParts(shipOrders);
	//const nextShipParts: Part[] = getNextShipParts(shipOrders); // Calculate based on fetched orders
	const allPartNames = getAllUniquePartNames(shipOrders);

	const modalStyle = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: { xs: "90%", sm: 500 },
		bgcolor: "background.paper",
		borderRadius: "12px",
		boxShadow: 24,
		p: 4,
		display: "flex",
		flexDirection: "column",
		gap: 2,
		background: 'transparent'
	};

	return (
		<Box
			id="Container-Box"
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: "100%",
				color: "white",
				overflow: "hidden",
				background: 'transparent'
			}}
		>
			<Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
				<Button
					variant="contained"
					startIcon={<CalendarPlus />}
					onClick={handleOpenModal}
					sx={{
						bgcolor: "#7b68ee",
						"&:hover": {
							bgcolor: "#6a5acd",
						},
						boxShadow: "0 4px 15px rgba(123, 104, 238, 0.4)",
						borderRadius: "12px",
						textTransform: "none",
					}}
				>
					Add New Order
				</Button>
			</Box>
			<Box
				id="Container-Box-Box"
				sx={{
					display: "flex",
					flexDirection: "column",
					flexWrap: "nowrap",
					flexGrow: 1,
					width: "100%",
					maxHeight: '100vh',
					height: "100vh",
					borderRadius: "8px",
					overflowY: "scroll",
					background: 'transparent'
				}}
			>
				<Box
					id="boxi"
					sx={{
						display: "flex",
						flexDirection: "column",
						flexWrap: "nowrap",
						gap: 2,
						mb: 2, 
						mr: 0,
						flexGrow: 1,
						width: "99.3%",
					}}
				>
					<Paper sx={{ flexGrow: 1 }}>
						<Paper
							elevation={3}
							sx={{ borderRadius: "12px", overflow: "hidden", background: 'transparent' }}
						>
							<Box
								sx={{
									p: { xs: 1, sm: 1 },
								}}
							>
								<Typography
									variant="h5"
									component="h2"
									gutterBottom
									sx={{ textAlign: "center",fontWeight: 'bold', color: '#7B68EE' }}
								>
									Total Parts for All Ships
								</Typography>
							</Box>
							<TableContainer sx={{borderRadius: '12px', background: 'rgba(255,255,255,0.05)'}}>
								<Table size="small">
									<TableHead>
										<TableRow>
											{totalParts.map((part) => (
												<TableCell
													key={part.name}
													sx={{
														fontWeight: "bold",
														textAlign: "center",
														p: 0,
														overflow: "hidden",
														whiteSpace: "nowrap",
														color: '#7B68EE',
														border: 'none',
													}}
												>
													{part.name}
												</TableCell>
											))}
										</TableRow>
									</TableHead>
									<TableBody>
										<TableRow>
											{totalParts.length > 0 ? (
												totalParts.map((part) => (
													<TableCell key={part.name} align="right" sx={{
														color: 'rgba(200,200,200,0.9)',
														border: 'none',
														textAlign: "center"
													}}>
														{part.quantity}
													</TableCell>
												))
											) : (
												<TableCell
													colSpan={
														allPartNames.length > 0 ? allPartNames.length : 1
													}
													align="center"
												>
													<Typography variant="body2" color="text.secondary">
														No parts needed.
													</Typography>
												</TableCell>
											)}
										</TableRow>
									</TableBody>
								</Table>
							</TableContainer>
						</Paper>
					</Paper>
				</Box>

				<Box sx={{ mb: 2, mr: 1}}>
					<Paper
						elevation={3}
						sx={{
							borderRadius: "12px",
							background: 'transparent',
							width: "100%",
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexWrap: "wrap",
								gap: 1,
								mb: 2,
								justifyContent: "center"
							}}
						>
							{MOCK_SHIP_TYPES.map((ship) => (
								<Chip
									key={ship.id}
									label={ship.name}
									onClick={() => handleFilterClick(ship.id)}
									variant={
										selectedShipTypes.includes(ship.id) ? "filled" : "outlined"
									}
									sx={{
										cursor: "pointer",
										...(selectedShipTypes.includes(ship.id)
											? {
													backgroundColor: "#7b68ee",
													color: "white",
													borderColor: "#7b68ee",
													"&:hover": {
														backgroundColor: "#6a5acd",
													},
											  }
											: {
													backgroundColor: "transparent",
													color: "white",
													borderColor: "#7b68ee",
													"&:hover": {
														backgroundColor: "rgba(123, 104, 238, 0.1)",
													},
											  }),
									}}
								/>
							))}
						</Box>
						<TableContainer
							sx={{ maxHeight: 600, overflowX: "auto", overflowY: "auto", background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}
						>
							<Table size="small" stickyHeader sx={{ tableLayout: "auto", minWidth: 600 }}>
								<TableHead>
									<TableRow>
										<TableCell
											sx={{
												fontWeight: "bold",
												maxWidth: "70px",
												p: 1,
												position: "sticky",
												left: 0,
												zIndex: 4,
												border: 'none',
												backgroundColor: '#1c1b27',
												textAlign: 'center',
												color: '#7B68EE'
											}}
										>
											Ship
										</TableCell>
										{partNames.map((partName) => (
											<TableCell
												key={partName}
												sx={{
													fontWeight: "bold",
													textAlign: "center",
													whiteSpace: "nowrap",
													p: 1,
													minWidth: "25px",
														border: 'none',
														backgroundColor: '#1c1b27',
														color: '#7B68EE'
												}}
											>
												<span>{partName}</span>
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									{summaryData.map((order, index) => (
										<TableRow key={index}>
											<TableCell
												sx={{
													fontWeight: "bold",
													wordWrap: "break-word",
													p: 0.5,
													position: "sticky",
													left: 0,
													bgcolor: "#1c1b27",
													zIndex: 3,
														border: 'none',
														textAlign: 'center',
														color: 'rgba(200,200,200,0.9)'
												}}
											>
												{order.combinedHeader.toString()}
											</TableCell>
											{partNames.map((partName) => {
												const partData = order[partName] as {
													value: number;
													isAvailable: boolean;
												};
												return (
													<TableCell
														key={partName}
														sx={{
															textAlign: "center",
															backgroundColor: partData.isAvailable
																? "#00ff00a9"
																: "#ff2200d7",
															p: 0,
															overflow: "hidden",
															whiteSpace: "nowrap",
															border: 'none',
															color: 'rgba(230,230,230,1)'
														}}
													>
														{partData.value}
													</TableCell>
												);
											})}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</Paper>
				</Box>

				<ShipOrders isMobile={isMobile} processedOrders={processedOrders} />
			</Box>
			<Modal
				open={isModalOpen}
				onClose={handleCloseModal}
				aria-labelledby="add-order-modal"
				aria-describedby="form-to-add-a-new-ship-order"
			>
				<Box sx={modalStyle}>
					<Typography
						id="add-order-modal"
						variant="h6"
						component="h2"
						sx={{ textAlign: "center" }}
					>
						Add New Ship Order
					</Typography>
					<TextField
						name="customer"
						label="Customer Name"
						value={newOrder.customer}
						onChange={handleInputChange}
						fullWidth
					/>
					<TextField
						name="shipTypeId"
						label="Ship Type"
						select
						value={newOrder.shipTypeId}
						onChange={handleInputChange}
						fullWidth
					>
						{MOCK_SHIP_TYPES.map((ship) => (
							<MenuItem key={ship.id} value={ship.id}>
								{ship.name}
							</MenuItem>
						))}
					</TextField>
					<TextField
						name="price"
						label="Price ($)"
						type="number"
						value={newOrder.price}
						onChange={handleInputChange}
						fullWidth
					/>
					<TextField
						name="waitTime"
						label="Wait Time (days)"
						type="number"
						value={newOrder.waitTime}
						onChange={handleInputChange}
						fullWidth
					/>
					<TextField
						name="notes"
						label="Notes"
						value={newOrder.notes}
						onChange={handleInputChange}
						multiline
						rows={2}
						fullWidth
					/>
					<Button variant="contained" onClick={handleAddOrder} sx={{ mt: 2 }}>
						Add Order
					</Button>
				</Box>
			</Modal>
		</Box>
	);
};

export default ProductionDashboard;
