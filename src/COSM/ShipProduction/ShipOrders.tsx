import {
	Box,
	Paper,
	Typography,
	Chip,
	Grid,
	Table,
	TableContainer,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from "@mui/material";
import { format } from "date-fns";
import { CheckCircle, Clock, ArrowUpRightFromSquare } from "lucide-react";
import React from "react";

interface Part {
	isAvailable: boolean;
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

export const ShipOrders = ({ isMobile, processedOrders }: {isMobile: boolean, processedOrders: ShipOrder[]}) => {
  const tableHeaders = ["Customer", "Ship Type","Price","Wait Time","Completion Date","Status","Notes"]

	const getStatusColor = (status: ShipOrder["status"]) => {
		switch (status) {
			case "Completed":
				return "success" as const;
			case "In Progress":
				return "warning" as const;
			case "Pending":
			default:
				return "info" as const;
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				flexWrap: "nowrap",
				width: "100%",
				flexGrow: 1,
				overflow: "hidden",
				borderRadius: "8px",
        minHeight: '100%'
			}}
		>
			<Paper
				elevation={3}
				sx={{
					borderRadius: "12px",
          background: 'transparent',
          height: '100%'
				}}
			>
				<Box
					sx={{
						display: "flex",
            flexDirection: 'column',
						flexWrap: "nowrap",
						justifyContent: "center",
            overflow: 'hidden',
            height: '100%',
            mr: 1
					}}
				>
          <Typography
					variant="h5"
					component="h2"
					gutterBottom
					sx={{ textAlign: "center", color: '#7B68EE' }}
				>
					Ship Production Queue
				</Typography>
					{isMobile ? (
						<Grid container spacing={2} sx={{ flexGrow: 1 }}>
							{processedOrders.map((order: ShipOrder) => (
								<Paper key={order.id} sx={{ width: "100%" }}>
									<Paper
										sx={{ p: 2, backgroundColor: "#242424", minWidth: "100%" }}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												mb: 1,
											}}
										>
											<Typography variant="h6" sx={{ color: "primary.light" }}>
												{order.customer}
											</Typography>
											<Chip
												label={order.status}
												color={getStatusColor(order.status)}
												size="small"
												icon={
													order.status === "Completed" ? (
														<CheckCircle style={{ fontSize: 16 }} />
													) : order.status === "In Progress" ? (
														<Clock style={{ fontSize: 16 }} />
													) : (
														<ArrowUpRightFromSquare style={{ fontSize: 16 }} />
													)
												}
											/>
										</Box>
										<Typography variant="body2" sx={{ mb: 1 }}>
											{order.shipType.name}
										</Typography>
										<Grid container spacing={1}>
											<Paper>
												<Typography variant="body2" sx={{ fontWeight: "bold" }}>
													Price:
												</Typography>
												<Typography variant="body2">
													${order.price.toLocaleString()}
												</Typography>
											</Paper>
											<Paper>
												<Typography variant="body2" sx={{ fontWeight: "bold" }}>
													Wait Time:
												</Typography>
												<Typography variant="body2">
													{order.waitTimeDays} days
												</Typography>
											</Paper>
											<Paper>
												<Typography variant="body2" sx={{ fontWeight: "bold" }}>
													Completion:
												</Typography>
												<Typography variant="body2">
													{format(order.completionDate, "P")}
												</Typography>
											</Paper>
										</Grid>
										{order.status === "In Progress" && (
											<Box sx={{ maxHeight: "100%" }}>
												<TableContainer
													sx={{ maxHeight: 400, overflowY: "scroll", p: 0 }}
												>
													<Table
														size="small"
														stickyHeader
														aria-label="parts table"
													>
														<TableHead>
															<TableRow>
																<TableCell
																	sx={{ fontWeight: "bold", border: 0, p: 1 }}
																>
																	Part
																</TableCell>
																<TableCell
																	sx={{ fontWeight: "bold", border: 0, p: 1 }}
																	align="right"
																>
																	Quantity
																</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{order.processedParts.map(
																(part: any, partIndex: number) => (
																	<TableRow key={partIndex}>
																		<TableCell
																			sx={{
																				border: 0,
																				p: 1,
																				fontWeight: "bold",
																				color: part.isAvailable
																					? "success.main"
																					: "error.main",
																			}}
																		>
																			{part.name}
																		</TableCell>
																		<TableCell
																			sx={{
																				border: 0,
																				p: 1,
																				color: part.isAvailable
																					? "success.main"
																					: "error.main",
																			}}
																			align="right"
																		>
																			{part.quantity}
																		</TableCell>
																	</TableRow>
																)
															)}
														</TableBody>
													</Table>
												</TableContainer>
											</Box>
										)}
									</Paper>
								</Paper>
							))}
						</Grid>
					) : (
						<TableContainer sx={{ maxHeight: '100%', overflowY: 'scroll', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
							<Table size="small" stickyHeader sx={{ height: '100vh', tableLayout: "auto", minWidth: 600 }}>
								<TableHead>
									<TableRow sx={{
                    backgroundColor: 'transparent'
                  }}>
                    {tableHeaders.map((header) => {
                      return(
                        <TableCell key={header} sx={{
												fontWeight: "bold",
												p: 1,
												position: "sticky",
												left: 0,
												zIndex: 4,
												border: 'none',
												backgroundColor: '#1c1b27',
												textAlign: 'center',
												color: '#7B68EE'
											}}>
                          {header}
                        </TableCell>
                      )
                    })}
									</TableRow>
								</TableHead>
								<TableBody>
									{processedOrders.sort((a: ShipOrder, b: ShipOrder) => Number(b.id) - Number(a.id)).map((order: ShipOrder) => (
										<React.Fragment key={order.id}>
											<TableRow
												sx={{
													"&:hover": {
														backgroundColor: "rgba(255, 255, 255, 0.05)",
													}
												}}
											>
												<TableCell sx={{textAlign: 'center'}}>{order.customer}</TableCell>
												<TableCell sx={{textAlign: 'center'}}>{order.shipType.name}</TableCell>
												<TableCell sx={{textAlign: 'center'}}>${order.price.toLocaleString()}</TableCell>
												<TableCell sx={{textAlign: 'center'}}>{order.waitTimeDays} days</TableCell>
												<TableCell sx={{textAlign: 'center'}}>
													{format(order.completionDate, "P")}
												</TableCell>
												<TableCell sx={{textAlign: 'center'}}>
													<Chip
														label={order.status}
														color={getStatusColor(order.status)}
														size="small"
														icon={
															order.status === "Completed" ? (
																<CheckCircle style={{ fontSize: 16 }} />
															) : order.status === "In Progress" ? (
																<Clock style={{ fontSize: 16 }} />
															) : (
																<ArrowUpRightFromSquare
																	style={{ fontSize: 16 }}
																/>
															)
														}
													/>
												</TableCell>
												<TableCell sx={{textAlign: 'center'}}>{order.notes}</TableCell>
											</TableRow>
											{order.status === "In Progress" && (
												<TableRow>
													<TableCell colSpan={7} sx={{ p: 0 }}>
														<TableContainer
															sx={{
																ml: 0,
																mr: 2,
																p: 1,
																borderRadius: "4px",
																border: "1px solid rgba(255, 255, 255, 0.1)",
															}}
														>
															<Table
																size="small"
																sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}
															>
																<TableHead>
																	<TableRow>
																		{order.processedParts.map(
																			(part: Part, partIndex: number) => (
																				<TableCell
																					key={partIndex}
																					sx={{
																						fontWeight: "bold",
																						color: "primary.light",
																						p: 0,
																						border: 0,
																						textAlign: "center",
																					}}
																				>
																					{part.name}
																				</TableCell>
																			)
																		)}
																	</TableRow>
																</TableHead>
																<TableBody>
																	<TableRow>
																		{order.processedParts.map(
																			(part: Part, partIndex: number) => (
																				<TableCell
																					key={partIndex}
																					sx={{
																						p: 0,
																						color: part.isAvailable
																							? "success.main"
																							: "error.main",
																						border: 0,
																						textAlign: "center",
																					}}
																				>
																					{part.quantity}
																				</TableCell>
																			)
																		)}
																	</TableRow>
																</TableBody>
															</Table>
														</TableContainer>
													</TableCell>
												</TableRow>
											)}
										</React.Fragment>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</Box>
			</Paper>
		</Box>
	);
};
