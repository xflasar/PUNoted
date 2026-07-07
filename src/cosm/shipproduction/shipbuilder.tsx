import React from "react";
import {
	Box,
	Paper,
	Stack,
	IconButton,
	Divider,
	Chip,
	FormControlLabel,
	Checkbox,
	Switch,
	Tabs,
	Tab,
	TextField,
	MenuItem,
	Grid,
	Button,
	Typography,
	useTheme,
	useMediaQuery,
	alpha,
} from "@mui/material";
import {
	ArrowBack as ArrowBackIcon,
	CheckCircle as CheckCircleIcon,
	Business as BusinessIcon,
} from "@mui/icons-material";
import MaterialBadge from "../components/materialbadge";

import { useShipBuilder } from "./hooks/useshipbuilder";
import {
	MATERIAL_SPECS,
	FORM_SPECS,
	DERIVED_SPECS,
	SHIP_SYSTEMS_MOCK,
	STATIC_PRESETS,
} from "./utils/constants";

interface BuilderPart {
	name: string;
	quantity: number;
}

interface ShipBuilderProps {
	mockRole: "ADMIN" | "USER" | "GUEST";
	onOrderCreated: (guestPin?: string) => void;
	editingOrderId?: string | null;
	onCancelEdit?: () => void;
}

export const ShipBuilder: React.FC<ShipBuilderProps> = ({
	mockRole,
	onOrderCreated,
	editingOrderId,
	onCancelEdit,
}) => {
	const theme = useTheme();
	const isMobileViewport = useMediaQuery(theme.breakpoints.down("md"));

	const {
		mobileActiveTab,
		setMobileActiveTab,
		testMode,
		setTestMode,
		isAdmin,
		shipClass,
		setShipClass,
		selectedPresetId,
		handlePresetChange,
		selections,
		handleSystemOptionChange,
		companyCode,
		setCompanyCode,
		username,
		setUsername,
		specialNeeds,
		setSpecialNeeds,
		isCorpMember,
		setIsCorpMember,
		isForSomeoneElse,
		setIsForSomeoneElse,
		price,
		setPrice,
		isCustomPrice,
		setIsCustomPrice,
		waitTime,
		createdPin,
		setCreatedPin,
		presetDiffs,
		dynamicStats,
		partsList,
		performanceSum,
		cxTotalPrice,
		handleSaveOrder,
		handleConfirmOrder,
	} = useShipBuilder({ mockRole, onOrderCreated, editingOrderId });

	const isFullScreenMode = !!editingOrderId;
	const buildTimeHours = Math.round(performanceSum.weight / 50);

	const MetadataRow = (
		<Paper
			sx={{
				p: { xs: 1, sm: 1.5 },
				borderRadius: "12px",
				background: "rgba(25, 24, 35, 0.8)",
				border: "1px solid rgba(255,255,255,0.05)",
				width: "100%",
			}}
		>
			{isMobileViewport ? (
				<Stack spacing={1.2}>
					{/* Row 1: Toggles */}
					<Stack
						direction="row"
						spacing={1}
						justifyContent="space-between"
						alignItems="center"
						sx={{ px: 0.5 }}
					>
						<FormControlLabel
							control={
								<Switch
									checked={testMode}
									onChange={(e) => setTestMode(e.target.checked)}
									color="warning"
									size="small"
								/>
							}
							label={
								<Typography
									variant="caption"
									sx={{
										color: testMode ? "#ff9800" : "rgba(255,255,255,0.5)",
										fontWeight: "bold",
										fontSize: "12px",
									}}
								>
									TEST MODE
								</Typography>
							}
						/>
						<FormControlLabel
							control={
								<Checkbox
									checked={isCorpMember}
									disabled={testMode}
									size="small"
									onChange={(e) => setIsCorpMember(e.target.checked)}
									sx={{
										p: 0.5,
										color: "#7b68ee",
										"&.Mui-checked": { color: "#7b68ee" },
									}}
								/>
							}
							label={
								<Stack direction="row" spacing={0.2} alignItems="center">
									<BusinessIcon
										sx={{
											fontSize: "16px",
											color: isCorpMember ? "#10b981" : "rgba(255,255,255,0.4)",
										}}
									/>
									<Typography variant="caption" sx={{ fontSize: "12px" }}>
										Corp Member
									</Typography>
								</Stack>
							}
						/>
					</Stack>

					{/* Row 2: Text Inputs */}
					<Stack direction="row" spacing={1}>
						<TextField
							label="Company"
							value={companyCode}
							disabled={testMode}
							onChange={(e) => setCompanyCode(e.target.value)}
							size="small"
							fullWidth
							sx={inputStyle}
							inputProps={{
								style: {
									textAlign: "center",
									fontSize: "12px",
									padding: "6px",
								},
							}}
							InputLabelProps={{ style: { fontSize: "12px" } }}
						/>
						<TextField
							label="User"
							value={username}
							disabled={testMode}
							onChange={(e) => setUsername(e.target.value)}
							size="small"
							fullWidth
							sx={inputStyle}
							inputProps={{
								style: {
									textAlign: "center",
									fontSize: "12px",
									padding: "6px",
								},
							}}
							InputLabelProps={{ style: { fontSize: "12px" } }}
						/>
					</Stack>

					{/* Row 3: Preset & Class Selectors */}
					<Stack direction="row" spacing={1}>
						<TextField
							select
							size="small"
							label="Preset"
							value={selectedPresetId}
							onChange={(e) => handlePresetChange(e.target.value)}
							fullWidth
							sx={selectStyle}
							SelectProps={{ style: { fontSize: "12px", padding: "4px" } }}
							InputLabelProps={{ style: { fontSize: "12px" } }}
						>
							{isAdmin && (
								<MenuItem value="custom" sx={{ fontSize: "12px" }}>
									Custom
								</MenuItem>
							)}
							{STATIC_PRESETS.map((p) => (
								<MenuItem key={p.id} value={p.id} sx={{ fontSize: "12px" }}>
									{p.name}
								</MenuItem>
							))}
						</TextField>
						<TextField
							select
							size="small"
							label="Class"
							value={shipClass}
							disabled={!isAdmin}
							onChange={(e) => setShipClass(e.target.value as any)}
							fullWidth
							sx={selectStyle}
							SelectProps={{ style: { fontSize: "12px", padding: "4px" } }}
							InputLabelProps={{ style: { fontSize: "12px" } }}
						>
							<MenuItem value="REGULAR" sx={{ fontSize: "12px" }}>
								Regular
							</MenuItem>
							<MenuItem value="COLONY_SHIP" sx={{ fontSize: "12px" }}>
								Colony
							</MenuItem>
						</TextField>
					</Stack>
				</Stack>
			) : (
				<Grid
					container
					spacing={0.8}
					alignItems="center"
					justifyContent="center"
				>
					<Grid
						item
						xs={6}
						sm={3}
						md={2}
						sx={{ display: "flex", justifyContent: "center" }}
					>
						<FormControlLabel
							control={
								<Switch
									checked={testMode}
									onChange={(e) => setTestMode(e.target.checked)}
									color="warning"
									size="small"
								/>
							}
							label={
								<Typography
									variant="caption"
									sx={{
										color: testMode ? "#ff9800" : "rgba(255,255,255,0.5)",
										fontWeight: "bold",
										fontSize: "12px",
									}}
								>
									TEST MODE
								</Typography>
							}
						/>
					</Grid>
					<Grid
						item
						xs={6}
						sm={3}
						md={2.5}
						sx={{ display: "flex", justifyContent: "center" }}
					>
						<TextField
							label="Company"
							value={companyCode}
							disabled={testMode}
							onChange={(e) => setCompanyCode(e.target.value)}
							size="small"
							sx={{ width: "95%", ...inputStyle }}
							inputProps={{
								style: {
									textAlign: "center",
									fontSize: "12px",
									padding: "6px",
								},
							}}
							InputLabelProps={{ style: { fontSize: "12px" } }}
						/>
					</Grid>
					<Grid
						item
						xs={6}
						sm={3}
						md={2}
						sx={{ display: "flex", justifyContent: "center" }}
					>
						<TextField
							label="User"
							value={username}
							disabled={testMode}
							onChange={(e) => setUsername(e.target.value)}
							size="small"
							sx={{ width: "95%", ...inputStyle }}
							inputProps={{
								style: {
									textAlign: "center",
									fontSize: "12px",
									padding: "6px",
								},
							}}
							InputLabelProps={{ style: { fontSize: "12px" } }}
						/>
					</Grid>
					<Grid
						item
						xs={6}
						sm={3}
						md={2.5}
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<FormControlLabel
							control={
								<Checkbox
									checked={isCorpMember}
									disabled={testMode}
									size="small"
									onChange={(e) => setIsCorpMember(e.target.checked)}
									sx={{
										p: 0.5,
										color: "#7b68ee",
										"&.Mui-checked": { color: "#7b68ee" },
									}}
								/>
							}
							label={
								<Stack direction="row" spacing={0.2} alignItems="center">
									<BusinessIcon
										sx={{
											fontSize: "14px",
											color: isCorpMember ? "#10b981" : "rgba(255,255,255,0.4)",
										}}
									/>
									<Typography variant="caption" sx={{ fontSize: "12px" }}>
										Corp
									</Typography>
								</Stack>
							}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Stack direction="row" spacing={1} justifyContent="center">
							<TextField
								select
								size="small"
								label="Preset"
								value={selectedPresetId}
								onChange={(e) => handlePresetChange(e.target.value)}
								sx={{ minWidth: 80, ...selectStyle }}
								SelectProps={{ style: { fontSize: "12px", padding: "4px" } }}
								InputLabelProps={{ style: { fontSize: "12px" } }}
							>
								{isAdmin && (
									<MenuItem value="custom" sx={{ fontSize: "12px" }}>
										Custom
									</MenuItem>
								)}
								{STATIC_PRESETS.map((p) => (
									<MenuItem key={p.id} value={p.id} sx={{ fontSize: "12px" }}>
										{p.name}
									</MenuItem>
								))}
							</TextField>
							<TextField
								select
								size="small"
								label="Class"
								value={shipClass}
								disabled={!isAdmin}
								onChange={(e) => setShipClass(e.target.value as any)}
								sx={{ minWidth: 80, ...selectStyle }}
								SelectProps={{ style: { fontSize: "12px", padding: "4px" } }}
								InputLabelProps={{ style: { fontSize: "12px" } }}
							>
								<MenuItem value="REGULAR" sx={{ fontSize: "12px" }}>
									Regular
								</MenuItem>
								<MenuItem value="COLONY_SHIP" sx={{ fontSize: "12px" }}>
									Colony
								</MenuItem>
							</TextField>
						</Stack>
					</Grid>
				</Grid>
			)}
		</Paper>
	);

	// Horizontal Glassy Pricing and Wait status row (Mobile Only)
	const PriceAndWaitBadgeRow = (
		<Paper
			sx={{
				p: 0.6,
				borderRadius: "12px",
				background: "rgba(30, 29, 45, 0.45)",
				backdropFilter: "blur(12px)",
				border: "1px solid rgba(255, 255, 255, 0.08)",
				width: "100%",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				gap: 3,
				boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
			}}
		>
			<Stack direction="row" spacing={0.5} alignItems="center">
				<Typography
					variant="caption"
					color="rgba(255,255,255,0.4)"
					sx={{ fontSize: "12px", fontWeight: "bold" }}
				>
					{testMode ? "ESTIMATED CX PRICE:" : "PRICE:"}
				</Typography>
				<Typography
					variant="body2"
					fontWeight="black"
					sx={{
						fontSize: "13.5px",
						color: testMode ? "#ff9800" : isCorpMember ? "#10b981" : "#4caf50",
					}}
				>
					${price.toLocaleString()}
				</Typography>
				{isCorpMember && !testMode && (
					<Chip
						label="Corp"
						size="small"
						color="success"
						sx={{ height: 16, fontSize: "10px", px: 0.3 }}
					/>
				)}
			</Stack>

			<Divider
				orientation="vertical"
				flexItem
				sx={{ borderColor: "rgba(255,255,255,0.08)" }}
			/>

			<Stack direction="row" spacing={0.5} alignItems="center">
				<Typography
					variant="caption"
					color="rgba(255,255,255,0.4)"
					sx={{ fontSize: "12px", fontWeight: "bold" }}
				>
					WAIT TIME:
				</Typography>
				<Typography
					variant="body2"
					fontWeight="black"
					sx={{ fontSize: "13.5px", color: "#2196f3" }}
				>
					{waitTime} Days
				</Typography>
			</Stack>

			{isCustomPrice && mockRole === "ADMIN" && !testMode && (
				<>
					<Divider
						orientation="vertical"
						flexItem
						sx={{ borderColor: "rgba(255,255,255,0.08)" }}
					/>
					<TextField
						label="Custom Price ($)"
						type="number"
						size="small"
						value={price}
						onChange={(e) => setPrice(Number(e.target.value))}
						sx={{ width: 120, ...inputStyle }}
						inputProps={{ style: { fontSize: "11px", padding: "2px 4px" } }}
					/>
				</>
			)}
		</Paper>
	);

	const BlueprintSpecificationPanel = (
		<Paper
			sx={{
				p: { xs: 0.4, sm: 1.8 },
				borderRadius: "12px",
				background: "rgba(25, 24, 35, 0.8)",
				border: "1px solid rgba(255,255,255,0.05)",
				display: "flex",
				flexDirection: "column",
				flexGrow: 1,
				minHeight: 0,
				height: "100%",
				width: "100%",
			}}
		>
			<Typography
				variant="caption"
				sx={{
					color: "rgba(255,255,255,0.4)",
					mb: 0.5,
					fontWeight: "bold",
					fontSize: "12px",
					textTransform: "uppercase",
				}}
			>
				BLUEPRINT SPECIFICATION
			</Typography>

			<Box
				sx={{
					flexGrow: 1,
					overflowY: "auto",
					p: { xs: 0.2, sm: 1 },
					background: "rgba(0,0,0,0.2)",
					borderRadius: "8px",
					border: "1px solid rgba(255,255,255,0.03)",
					display: "flex",
					flexDirection: "column",
					gap: 0.4,
				}}
			>
				{FORM_SPECS.map((spec) => {
					const isColonyOnly =
						spec.key === "VORTEX_REACTOR" || spec.key === "VORTEX_FUEL_TANK";
					if (isColonyOnly && shipClass !== "COLONY_SHIP") {
						return (
							<Box
								key={spec.key}
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									p: 0.5,
									borderBottom: "1px solid rgba(255,255,255,0.02)",
								}}
							>
								<Typography
									variant="body2"
									sx={{
										color: "rgba(255,255,255,0.3)",
										fontSize: "12px",
										width: "40%",
									}}
								>
									{spec.label}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										color: "rgba(255,255,255,0.2)",
										fontSize: "12px",
										width: "60%",
									}}
								>
									not required
								</Typography>
							</Box>
						);
					}

					const activeVal = selections[spec.key] || "";
					const optionsList = SHIP_SYSTEMS_MOCK[spec.key] || [];

					let modifierStr = "--";
					if (activeVal !== "NONE" && activeVal !== "") {
						const activeOpt = optionsList.find((o) => o.option === activeVal);
						if (activeOpt && activeOpt.modifierText) {
							modifierStr = activeOpt.modifierText;
						}
					} else {
						if (spec.key === "GRAVITY_SHIELD") modifierStr = "not protected";
						if (
							spec.key === "HEAT_SHIELD" ||
							spec.key === "WHIPPLE_SHIELD" ||
							spec.key === "RADIATION_SHIELD" ||
							spec.key === "REPAIR_DRONES"
						)
							modifierStr = "0%";
					}

					const diffItem = presetDiffs.find((diff) => diff.key === spec.key);
					const isModified = !!diffItem;
					const isAdded = diffItem ? diffItem.isAdded : false;

					const bgVal = isModified ? "rgba(255, 152, 0, 0.08)" : "transparent";
					const borderVal = isModified
						? "1px solid #ff9800"
						: "1px solid rgba(255,255,255,0.02)";

					// Mobile 2-row layout vs Desktop 1-row layout
					if (isMobileViewport) {
						return (
							<Box
								key={spec.key}
								sx={{
									display: "flex",
									alignItems: "center",
									p: 0.5,
									borderBottom: borderVal,
									background: bgVal,
									borderRadius: isModified ? "4px" : "0px",
									gap: 1,
								}}
							>
								<Typography
									variant="body2"
									sx={{
										color: "white",
										fontSize: "12px",
										fontWeight: "bold",
										width: "40%",
										display: "flex",
										alignItems: "center",
									}}
								>
									{spec.label}
								</Typography>

								<Stack spacing={0.5} sx={{ flexGrow: 1, width: "60%" }}>
									<Typography component="div">
										<TextField
											select
											size="small"
											value={activeVal}
											disabled={!isAdmin}
											onChange={(e) =>
												handleSystemOptionChange(spec.key, e.target.value)
											}
											fullWidth
											sx={formSelectStyle}
											SelectProps={{
												style: {
													fontSize: "12px",
													height: "22px",
													padding: "0px",
												},
											}}
										>
											{spec.allowNone && (
												<MenuItem value="NONE" sx={{ fontSize: "12px" }}>
													--
												</MenuItem>
											)}
											{optionsList.map((o) => (
												<MenuItem
													key={o.option}
													value={o.option}
													sx={{ fontSize: "12px" }}
												>
													{o.label}
												</MenuItem>
											))}
										</TextField>
									</Typography>
									<Stack direction="row" spacing={0.5} alignItems="center">
										{isModified && (
											<Typography
												variant="caption"
												sx={{
													color: "#ff9800",
													fontSize: "12px",
													fontWeight: "bold",
												}}
											>
												{isAdded ? "+" : "*"}
											</Typography>
										)}
										<Typography
											variant="caption"
											sx={{
												color: "#4caf50",
												fontSize: "12px",
											}}
										>
											{modifierStr}
										</Typography>
									</Stack>
								</Stack>
							</Box>
						);
					}

					return (
						<Box
							key={spec.key}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								p: 0.1,
								borderBottom: borderVal,
								background: bgVal,
								borderRadius: isModified ? "4px" : "0px",
								transition: "all 0.1s ease-in-out",
								gap: 0.3,
							}}
						>
							<Typography
								variant="body2"
								sx={{
									color: "white",
									fontSize: "12px",
									fontWeight: "medium",
									width: "35%",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{spec.label}
							</Typography>

							<Box sx={{ width: "40%" }}>
								<Typography component="div">
									<TextField
										select
										size="small"
										value={activeVal}
										disabled={!isAdmin}
										onChange={(e) =>
											handleSystemOptionChange(spec.key, e.target.value)
										}
										fullWidth
										sx={formSelectStyle}
										SelectProps={{
											style: {
												fontSize: "12px",
												height: "22px",
												padding: "0px",
											},
										}}
									>
										{spec.allowNone && (
											<MenuItem value="NONE" sx={{ fontSize: "12px" }}>
												--
											</MenuItem>
										)}
										{optionsList.map((o) => (
											<MenuItem
												key={o.option}
												value={o.option}
												sx={{ fontSize: "12px" }}
											>
												{o.label}
											</MenuItem>
										))}
									</TextField>
								</Typography>
							</Box>

							<Stack
								direction="row"
								spacing={0.2}
								alignItems="center"
								justifyContent="flex-end"
								sx={{ width: "25%" }}
							>
								{isModified && (
									<Typography
										variant="caption"
										sx={{
											color: "#ff9800",
											fontSize: "12px",
											fontWeight: "bold",
										}}
									>
										{isAdded ? "+" : "*"}
									</Typography>
								)}
								<Typography
									variant="caption"
									sx={{
										color: "#4caf50",
										fontSize: "12px",
										textAlign: "right",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{modifierStr}
								</Typography>
							</Stack>
						</Box>
					);
				})}

				<Divider sx={{ my: 0.8, borderColor: "rgba(255,255,255,0.08)" }} />

				<Typography
					variant="caption"
					sx={{
						mt: 0.2,
						mb: 0.4,
						color: "#7b68ee",
						fontWeight: "bold",
						fontSize: "12px",
						display: "block",
						textTransform: "uppercase",
					}}
				>
					AUTO-DERIVED SYSTEMS
				</Typography>

				{DERIVED_SPECS.map((spec) => {
					const isColonyOnly = spec.key === "HABITATION_MODULE";
					if (isColonyOnly && shipClass !== "COLONY_SHIP") return null;

					let valueText = "";
					if (spec.key === "STRUCTURE") valueText = `${dynamicStats.sscCount}`;
					if (spec.key === "COMMAND_BRIDGE")
						valueText = `${dynamicStats.bridgeTicker}`;
					if (spec.key === "CREW_QUARTERS")
						valueText = `${dynamicStats.crewTicker}`;
					if (spec.key === "FTL_FIELD_CONTROLLER")
						valueText = dynamicStats.hasFtl ? "1" : "0";
					if (spec.key === "FTL_EMITTER_SMALL")
						valueText = `${dynamicStats.sfeCount}`;
					if (spec.key === "FTL_EMITTER_MEDIUM")
						valueText = `${dynamicStats.mfeCount}`;
					if (spec.key === "FTL_EMITTER_LARGE")
						valueText = `${dynamicStats.lfeCount}`;
					if (spec.key === "HABITATION_MODULE")
						valueText = dynamicStats.habModuleCount > 0 ? "4" : "0";

					if (isMobileViewport) {
						return (
							<Box
								key={spec.key}
								sx={{
									display: "flex",
									alignItems: "center",
									p: 0.5,
									borderBottom: "1px solid rgba(255,255,255,0.02)",
									gap: 1,
									opacity: 0.85,
								}}
							>
								<Typography
									variant="body2"
									sx={{
										color: "rgba(255,255,255,0.6)",
										fontSize: "12px",
										fontWeight: "medium",
										width: "40%",
										display: "flex",
										alignItems: "center",
									}}
								>
									{spec.label}
								</Typography>

								<Stack spacing={0.5} sx={{ flexGrow: 1, width: "60%" }}>
									<Typography
										variant="body2"
										sx={{
											fontSize: "12px",
											color: "#7b68ee",
											fontWeight: "bold",
										}}
									>
										{valueText}
									</Typography>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											fontSize: "12px",
										}}
									>
										Derived
									</Typography>
								</Stack>
							</Box>
						);
					}

					return (
						<Box
							key={spec.key}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								p: 0.1,
								borderBottom: "1px solid rgba(255,255,255,0.02)",
								opacity: 0.85,
							}}
						>
							<Typography
								variant="body2"
								sx={{
									color: "rgba(255,255,255,0.6)",
									fontSize: "12px",
									fontWeight: "medium",
									width: "35%",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{spec.label}
							</Typography>

							<Box sx={{ width: "40%" }}>
								<Typography
									variant="body2"
									sx={{
										fontSize: "12px",
										color: "#7b68ee",
										fontWeight: "bold",
										pl: 1,
									}}
								>
									{valueText}
								</Typography>
							</Box>

							<Stack
								direction="row"
								spacing={0.2}
								alignItems="center"
								justifyContent="flex-end"
								sx={{ width: "25%" }}
							>
								<Typography
									variant="caption"
									sx={{
										color: "rgba(255,255,255,0.4)",
										fontSize: "12px",
										textAlign: "right",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									Derived
								</Typography>
							</Stack>
						</Box>
					);
				})}
			</Box>
		</Paper>
	);

	const PerformanceAndOverviewPanel = (
		<Stack
			spacing={0.8}
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				minHeight: 0,
				width: "100%",
			}}
		>
			{/* Price and Wait Info - Desktop Only */}
			{!isMobileViewport && (
				<Paper
					sx={{
						p: 0.8,
						borderRadius: "12px",
						background: testMode
							? "linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(28, 27, 39, 0.95))"
							: "rgba(25, 24, 35, 0.8)",
						border: testMode
							? "1px solid rgba(255, 152, 0, 0.3)"
							: "1px solid rgba(255,255,255,0.05)",
						width: "100%",
						textAlign: "center",
					}}
				>
					<Stack
						direction="row"
						spacing={1}
						justifyContent="center"
						alignItems="center"
					>
						<Box sx={{ textAlign: "center", flex: 1 }}>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px" }}
							>
								{testMode ? "ESTIMATED CX PRICE" : "PRICE"}
							</Typography>
							<Typography
								variant="body1"
								fontWeight="bold"
								sx={{
									fontSize: "14px",
									color: testMode
										? "#ff9800"
										: isCorpMember
											? "#10b981"
											: "#4caf50",
								}}
							>
								${price.toLocaleString()}
							</Typography>
							{isCorpMember && !testMode && (
								<Chip
									label="Corp"
									size="small"
									color="success"
									sx={{ height: 14, fontSize: "12px" }}
								/>
							)}
						</Box>
						<Divider
							orientation="vertical"
							flexItem
							sx={{ borderColor: "rgba(255,255,255,0.08)" }}
						/>
						<Box sx={{ textAlign: "center", flex: 1 }}>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px" }}
							>
								WAIT TIME
							</Typography>
							<Typography
								variant="body1"
								fontWeight="bold"
								sx={{ fontSize: "14px", color: "#2196f3" }}
							>
								{waitTime} Days
							</Typography>
						</Box>
					</Stack>

					{!testMode && (
						<Stack
							direction="column"
							alignItems="center"
							spacing={0.2}
							sx={{ mt: 0.5 }}
						>
							{mockRole === "ADMIN" && (
								<FormControlLabel
									control={
										<Checkbox
											size="small"
											checked={isCustomPrice}
											onChange={(e) => setIsCustomPrice(e.target.checked)}
											sx={{
												p: 0.2,
												color: "#7b68ee",
												"&.Mui-checked": { color: "#7b68ee" },
											}}
										/>
									}
									label={
										<Typography variant="caption" sx={{ fontSize: "12px" }}>
											Custom Price
										</Typography>
									}
								/>
							)}
						</Stack>
					)}
					{isCustomPrice && mockRole === "ADMIN" && !testMode && (
						<TextField
							label="Price ($)"
							type="number"
							size="small"
							value={price}
							onChange={(e) => setPrice(Number(e.target.value))}
							fullWidth
							sx={{ mt: 0.5, ...inputStyle }}
							inputProps={{ style: { fontSize: "12px", padding: "4px" } }}
						/>
					)}
				</Paper>
			)}

			{/* Performance & Ship Overview Premium Redesign - Space Saving 3-Column Grid */}
			<Paper
				sx={{
					p: 0.8,
					borderRadius: "12px",
					background: "rgba(25, 24, 35, 0.85)",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					width: "100%",
				}}
			>
				<Typography
					variant="caption"
					sx={{
						mb: 0.5,
						color: "#7b68ee",
						fontWeight: "bold",
						display: "block",
						textAlign: "center",
						fontSize: "12px",
						textTransform: "uppercase",
					}}
				>
					PERFORMANCE & SHIP OVERVIEW
				</Typography>
				<Grid container spacing={0.5}>
					{/* Volume */}
					<Grid item xs={4}>
						<Box
							sx={{
								p: 0.4,
								textAlign: "center",
								bgcolor: "rgba(255,255,255,0.02)",
								borderRadius: "4px",
								border: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", display: "block" }}
							>
								Volume
							</Typography>
							<Typography
								variant="body2"
								fontWeight="bold"
								sx={{ fontSize: "12px" }}
							>
								{dynamicStats.volume} m³
							</Typography>
						</Box>
					</Grid>
					{/* Mass */}
					<Grid item xs={4}>
						<Box
							sx={{
								p: 0.4,
								textAlign: "center",
								bgcolor: "rgba(255,255,255,0.02)",
								borderRadius: "4px",
								border: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", display: "block" }}
							>
								Mass
							</Typography>
							<Typography
								variant="body2"
								fontWeight="bold"
								sx={{ fontSize: "12px" }}
							>
								{performanceSum.weight} t
							</Typography>
						</Box>
					</Grid>
					{/* Build Time */}
					<Grid item xs={4}>
						<Box
							sx={{
								p: 0.4,
								textAlign: "center",
								bgcolor: "rgba(255,255,255,0.02)",
								borderRadius: "4px",
								border: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", display: "block" }}
							>
								Build Time
							</Typography>
							<Typography
								variant="body2"
								fontWeight="bold"
								sx={{ fontSize: "12px" }}
							>
								~{buildTimeHours}h
							</Typography>
						</Box>
					</Grid>
					{/* Max G Factor */}
					<Grid item xs={4}>
						<Box
							sx={{
								p: 0.4,
								textAlign: "center",
								bgcolor: "rgba(255,255,255,0.02)",
								borderRadius: "4px",
								border: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", display: "block" }}
							>
								Max G
							</Typography>
							<Typography
								variant="body2"
								fontWeight="bold"
								sx={{ fontSize: "12px" }}
							>
								{dynamicStats.maxGFactor}
							</Typography>
						</Box>
					</Grid>
					{/* Cargo Capacity Weight */}
					<Grid item xs={4}>
						<Box
							sx={{
								p: 0.4,
								textAlign: "center",
								bgcolor: "rgba(255,255,255,0.02)",
								borderRadius: "4px",
								border: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", display: "block" }}
							>
								Cargo (t)
							</Typography>
							<Typography
								variant="body2"
								fontWeight="bold"
								sx={{ fontSize: "12px" }}
							>
								{dynamicStats.cargoWgt} t
							</Typography>
						</Box>
					</Grid>
					{/* Cargo Capacity Volume */}
					<Grid item xs={4}>
						<Box
							sx={{
								p: 0.4,
								textAlign: "center",
								bgcolor: "rgba(255,255,255,0.02)",
								borderRadius: "4px",
								border: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", display: "block" }}
							>
								Cargo (m³)
							</Typography>
							<Typography
								variant="body2"
								fontWeight="bold"
								sx={{ fontSize: "12px" }}
							>
								{dynamicStats.cargoVol} m³
							</Typography>
						</Box>
					</Grid>
					{/* STL Fuel Capacity */}
					<Grid item xs={6}>
						<Box
							sx={{
								p: 0.4,
								textAlign: "center",
								bgcolor: "rgba(255,255,255,0.02)",
								borderRadius: "4px",
								border: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", display: "block" }}
							>
								STL Fuel
							</Typography>
							<Typography
								variant="body2"
								fontWeight="bold"
								sx={{ fontSize: "12px" }}
							>
								{dynamicStats.stlCapacity}
							</Typography>
						</Box>
					</Grid>
					{/* FTL Fuel Capacity */}
					<Grid item xs={6}>
						<Box
							sx={{
								p: 0.4,
								textAlign: "center",
								bgcolor: "rgba(255,255,255,0.02)",
								borderRadius: "4px",
								border: "1px solid rgba(255,255,255,0.03)",
							}}
						>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", display: "block" }}
							>
								FTL Fuel
							</Typography>
							<Typography
								variant="body2"
								fontWeight="bold"
								sx={{ fontSize: "12px" }}
							>
								{dynamicStats.ftlCapacity > 0
									? dynamicStats.ftlCapacity
									: "N/A"}
							</Typography>
						</Box>
					</Grid>
				</Grid>
			</Paper>

			{/* Preset Modifications Diff */}
			{presetDiffs.length > 0 && (
				<Paper
					sx={{
						p: 0.8,
						borderRadius: "12px",
						background: "rgba(25, 24, 35, 0.8)",
						border: "1px solid rgba(255, 152, 0, 0.2)",
						maxHeight: 120,
						overflowY: "auto",
					}}
				>
					<Typography
						variant="caption"
						color="#ff9800"
						sx={{
							display: "block",
							fontWeight: "bold",
							mb: 0.4,
							fontSize: "12px",
						}}
					>
						MODIFIED SELECTIONS
					</Typography>
					<Stack spacing={0.2}>
						{presetDiffs.map((diff) => {
							const spec = FORM_SPECS.find((s) => s.key === diff.key);
							const nameLabel = spec ? spec.label : diff.key;
							const preLabel =
								SHIP_SYSTEMS_MOCK[diff.key]?.find(
									(o) => o.option === diff.presetVal,
								)?.label || diff.presetVal;
							const curLabel =
								SHIP_SYSTEMS_MOCK[diff.key]?.find(
									(o) => o.option === diff.currentVal,
								)?.label || diff.currentVal;

							return (
								<Typography
									key={diff.key}
									variant="caption"
									sx={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}
								>
									{nameLabel}: {preLabel} →{" "}
									<span style={{ color: "#ff9800", fontWeight: "bold" }}>
										{curLabel}
									</span>
								</Typography>
							);
						})}
					</Stack>
				</Paper>
			)}

			{/* Bill of Materials (BOM) */}
			<Paper
				sx={{
					p: 0.8,
					borderRadius: "12px",
					background: "rgba(25, 24, 35, 0.8)",
					border: "1px solid rgba(255,255,255,0.05)",
					flexGrow: 1,
					minHeight: 150,
					display: "flex",
					flexDirection: "column",
					width: "100%",
				}}
			>
				<Typography
					variant="caption"
					sx={{ mb: 0.5, color: "#7b68ee", display: "block", fontSize: "12px" }}
				>
					BILL OF MATERIALS
				</Typography>

				<Box
					sx={{
						flexGrow: 1,
						overflowY: "auto",
						mb: 0.5,
						height: "100%",
						width: "100%",
					}}
				>
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
						{partsList.length === 0 ? (
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px" }}
							>
								No parts required.
							</Typography>
						) : (
							partsList.map((part) => (
								<Stack
									key={part.name}
									sx={{
										p: 0.3,
										px: 0.6,
										background: "rgba(25, 25, 255, 0.03)",
										borderRadius: "4px",
										border: "1px solid rgba(255,255,255,0.05)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexDirection: "row",
										gap: 0.2,
									}}
								>
									<Typography
										variant="caption"
										sx={{ fontSize: "12px", fontWeight: "bold" }}
									>
										{part.quantity}x
									</Typography>
									<Box
										sx={{
											display: "inline-block",
											transform: "scale(0.7)",
											transformOrigin: "left center",
										}}
									>
										<MaterialBadge ticker={part.name} />
									</Box>
								</Stack>
							))
						)}
					</Box>
				</Box>
				<Button
					variant="contained"
					fullWidth
					disabled={testMode}
					sx={{
						bgcolor: testMode ? "rgba(255, 152, 0, 0.3)" : "#7b68ee",
						color: testMode ? "rgba(255,255,255,0.4)" : "white",
						fontWeight: "bold",
						fontSize: "12px",
						py: 0.4,
					}}
					onClick={handleSaveOrder}
				>
					{testMode
						? "ORDER DISABLED"
						: editingOrderId
							? "Save Edits"
							: "ORDER"}
				</Button>
			</Paper>
		</Stack>
	);

	const contentBody = (
		<Box
			sx={{
				color: "white",
				display: "flex",
				flexDirection: "column",
				gap: 0.8,
				height: "100%",
				minHeight: 0,
				width: "100%",
				maxWidth: "1400px",
				mx: "auto",
				boxSizing: "border-box",
			}}
		>
			{/* Metadata Row */}
			{MetadataRow}

			{/* Always Visible Glassy Pricing Status Row on Mobile */}
			{isMobileViewport && PriceAndWaitBadgeRow}

			{/* Responsive mobile split tabs vs desktop dual columns */}
			{isMobileViewport ? (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						flexGrow: 1,
						minHeight: 0,
						width: "100%",
					}}
				>
					<Tabs
						value={mobileActiveTab}
						onChange={(_e, val) => setMobileActiveTab(val)}
						variant="scrollable"
						scrollButtons="auto"
						allowScrollButtonsMobile
						indicatorColor="primary"
						textColor="primary"
						TabIndicatorProps={{ style: { backgroundColor: "#7b68ee" } }}
						sx={{
							mb: 0.5,
							minHeight: 32,
							height: 32,
							"& .MuiTabs-flexContainer": {
								justifyContent: "center",
							},
							"& .MuiTab-root": {
								color: "rgba(255,255,255,0.5)",
								fontWeight: "bold",
								fontSize: "12px",
								minHeight: 32,
								py: 0.5,
							},
							"& .Mui-selected": { color: "#7b68ee !important" },
						}}
					>
						<Tab label="BUILDER" />
						<Tab label="OVERVIEW & BOM" />
					</Tabs>
					<Box sx={{ flexGrow: 1, minHeight: 0, overflowY: "auto", px: 0 }}>
						{mobileActiveTab === 0
							? BlueprintSpecificationPanel
							: PerformanceAndOverviewPanel}
					</Box>
				</Box>
			) : (
				<Grid
					container
					spacing={1.5}
					sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}
					alignItems="stretch"
					justifyContent="center"
				>
					{/* Left Column (60% width) */}
					<Grid
						item
						xs={12}
						md={7}
						sx={{
							display: "flex",
							flexDirection: "column",
							height: "100%",
							minHeight: 0,
							minWidth: 0,
							flexGrow: 1,
						}}
					>
						{BlueprintSpecificationPanel}
					</Grid>

					{/* Right Column (40% width) */}
					<Grid
						item
						xs={12}
						md={5}
						sx={{
							display: "flex",
							flexDirection: "column",
							height: "100%",
							minHeight: 0,
							minWidth: 0,
							width: { md: "35%" },
						}}
					>
						{PerformanceAndOverviewPanel}
					</Grid>
				</Grid>
			)}
		</Box>
	);

	if (createdPin) {
		return (
			<Paper
				sx={{
					p: 3,
					textAlign: "center",
					borderRadius: "16px",
					background: "rgba(30,29,45,0.9)",
					border: "1px solid rgba(255,255,255,0.08)",
					width: "100%",
					maxWidth: "400px",
					mx: "auto",
					my: "10%",
					color: "white",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 2,
				}}
			>
				<CheckCircleIcon sx={{ fontSize: 60, color: "#4caf50" }} />
				<Typography variant="h5" fontWeight="bold">
					Order Recorded
				</Typography>
				<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
					The order is currently in review. You can track this order or edit it
					later by utilizing the following PIN code:
				</Typography>
				<Typography
					variant="h3"
					fontWeight="bold"
					sx={{ color: "#ff9800", letterSpacing: 2, my: 1 }}
				>
					{createdPin}
				</Typography>
				<Typography variant="caption" color="rgba(255,255,255,0.4)">
					Make sure to save this PIN. You will need it to make edits or cancel
					the order.
				</Typography>
				<Button
					variant="contained"
					fullWidth
					sx={{ bgcolor: "#7b68ee", color: "white", fontWeight: "bold", mt: 1 }}
					onClick={handleConfirmOrder}
				>
					Confirm & Close
				</Button>
			</Paper>
		);
	}

	if (isFullScreenMode) {
		return (
			<Box
				sx={{
					width: "100%",
					height: "100%",
					p: 1.5,
					background: alpha(theme.palette.background.default, 0.85),
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
					boxSizing: "border-box",
					overflow: "hidden",
				}}
			>
				<Stack
					direction="row"
					spacing={2}
					alignItems="center"
					sx={{ mb: 1, flexShrink: 0 }}
				>
					{onCancelEdit && (
						<IconButton sx={{ color: "white", p: 0.5 }} onClick={onCancelEdit}>
							<ArrowBackIcon />
						</IconButton>
					)}
					<Typography variant="h6" fontWeight="bold" sx={{ color: "#7b68ee" }}>
						Edit Order Config
					</Typography>
				</Stack>
				<Box
					sx={{
						flexGrow: 1,
						minHeight: 0,
						display: "flex",
						flexDirection: "column",
					}}
				>
					{contentBody}
				</Box>
			</Box>
		);
	}

	return contentBody;
};

// Styling structures
const selectStyle = {
	"& .MuiOutlinedInput-root": {
		color: "white",
		height: 28,
		"& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
		"&.Mui-focused fieldset": { borderColor: "#7b68ee" },
	},
	"& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
};

const inputStyle = {
	"& .MuiOutlinedInput-root": {
		color: "white",
		"& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
	},
	"& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
};

const formSelectStyle = {
	"& .MuiOutlinedInput-root": {
		color: "white",
		height: 22,
		fontSize: "12px",
		background: "rgba(25, 24, 35, 0.8)",
		"& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
	},
};
export const ftlFuelTank = "FTL_FUEL_TANK";
export const ftlReactor = "FTL_REACTOR";
export const stlFuelTank = "STL_FUEL_TANK";
export const stlEngine = "STL_ENGINE";
export const cargoBay = "CARGO_BAY";
export const hullType = "HULL_TYPE";
