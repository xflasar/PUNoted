/* import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Box,
  Paper,
  Grid,
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
  TableSortLabel,
  Stack,
  styled,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  RocketLaunch,
  TableChart,
  Storefront,
  People,
  PriceChange,
} from "@mui/icons-material";

const ModalContent = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  backgroundColor: "#1f2937",
  color: "white",
  boxShadow: "0px 0px 20px rgba(123, 104, 238, 0.4)",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

// Mock Data for a simulated server response
const mockPlanets = [
  {
    id: 1,
    name: "Aethel",
    description: "A remote ice planet, a major hub for rare-gas extraction.",
    totalTonsIn: 1200,
    totalCbmIn: 1000,
    totalTonsOut: 800,
    totalCbmOut: 700,
    totalShipmentImports: 15,
    totalShipmentExports: 10,
  },
  {
    id: 2,
    name: "Xylos",
    description: "Known for its giant, bioluminescent fungi forests.",
    totalTonsIn: 500,
    totalCbmIn: 450,
    totalTonsOut: 600,
    totalCbmOut: 550,
    totalShipmentImports: 8,
    totalShipmentExports: 12,
  },
  {
    id: 3,
    name: "Kyperion",
    description: "A scorched desert world, rich in ferrous minerals and alloys.",
    totalTonsIn: 300,
    totalCbmIn: 280,
    totalTonsOut: 450,
    totalCbmOut: 400,
    totalShipmentImports: 2,
    totalShipmentExports: 5,
  },
  {
    id: 4,
    name: "Vorlag",
    description: "An oceanic planet with floating cities and deep-sea mining operations.",
    totalTonsIn: 900,
    totalCbmIn: 850,
    totalTonsOut: 750,
    totalCbmOut: 700,
    totalShipmentImports: 20,
    totalShipmentExports: 15,
  },
  {
    id: 5,
    name: "Vesperia",
    description: "A lush, temperate world famous for its exotic flora and fauna.",
    totalTonsIn: 750,
    totalCbmIn: 700,
    totalTonsOut: 900,
    totalCbmOut: 850,
    totalShipmentImports: 10,
    totalShipmentExports: 25,
  },
];

const mockShipments = [
  {
    id: 1,
    planetId: 1,
    type: "Import",
    from: "Earth",
    tons: 150,
    cbm: 120,
    price: "2,000,000 CR",
    deadline: "2025-10-01",
  },
  {
    id: 2,
    planetId: 1,
    type: "Import",
    from: "Titan",
    tons: 50,
    cbm: 40,
    price: "1,500,000 CR",
    deadline: "2025-09-25",
  },
  {
    id: 3,
    planetId: 1,
    type: "Export",
    to: "Earth",
    tons: 200,
    cbm: 180,
    price: "Negotiable",
    deadline: "2025-10-15",
  },
  {
    id: 4,
    planetId: 2,
    type: "Import",
    from: "Mars",
    tons: 75,
    cbm: 60,
    price: "500,000 - 700,000 CR",
    deadline: "2025-10-05",
  },
  {
    id: 5,
    planetId: 2,
    type: "Export",
    to: "Earth",
    tons: 100,
    cbm: 90,
    price: "800,000 CR",
    deadline: "2025-10-20",
  },
  {
    id: 6,
    planetId: 3,
    type: "Import",
    from: "Venus",
    tons: 30,
    cbm: 25,
    price: "250,000 CR",
    deadline: "2025-09-30",
  },
];

const mockRentalSpaces = [
  {
    id: 1,
    planetId: 1,
    ownerId: "user123",
    tonsAvailable: 500,
    cbmAvailable: 450,
    totalTons: 1500,
    totalCbm: 1200,
    price: "Negotiable",
  },
  {
    id: 2,
    planetId: 1,
    ownerId: "user456",
    tonsAvailable: 200,
    cbmAvailable: 180,
    totalTons: 800,
    totalCbm: 700,
    price: "10,000 CR per ton",
  },
  {
    id: 3,
    planetId: 3,
    ownerId: "user789",
    tonsAvailable: 100,
    cbmAvailable: 90,
    totalTons: 300,
    totalCbm: 250,
    price: "15,000 - 20,000 CR per cbm",
  },
];

const ShipmentType = {
  EXPORT: "Export",
  IMPORT: "Import",
};

const PriceType = {
  NEGOTIABLE: "Negotiable",
  RANGE: "Range",
  EXACT: "Exact Price",
};

const ShippingBoard = () => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [shipmentType, setShipmentType] = useState(ShipmentType.IMPORT);
  const [newShipment, setNewShipment] = useState({
    from: "",
    to: "",
    tons: 0,
    cbm: 0,
    priceType: PriceType.EXACT,
    priceValue: "",
    deadline: "",
  });

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    if (!selectedPlanet) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Mock fetch for shipments
        // In a real application, you would replace this with a real API call.
        const shipmentResponse = await fetch(`https://punoted.ddns.net/api/shipments?planetId=${selectedPlanet.id}`);
        const shipmentsData = mockShipments; // Using mock data for now
        setShipments(shipmentsData.filter(s => s.planetId === selectedPlanet.id));

        // Mock fetch for rentals
        // In a real application, you would replace this with a real API call.
        const rentalResponse = await fetch(`https://punoted.ddns.net/api/planets_shipment_data?planetId=${selectedPlanet.id}`);
        const rentalsData = mockRentalSpaces; // Using mock data for now
        setRentals(rentalsData.filter(r => r.planetId === selectedPlanet.id));

      } catch (error) {
        console.error("Failed to fetch data:", error);
        setShipments(mockShipments.filter(s => s.planetId === selectedPlanet.id));
        setRentals(mockRentalSpaces.filter(r => r.planetId === selectedPlanet.id));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedPlanet]);

  const handlePlanetSelect = (planetId) => {
    const planet = mockPlanets.find((p) => p.id === planetId);
    setSelectedPlanet(planet);
  };

  const handleBackToPlanets = () => {
    setSelectedPlanet(null);
  };

  const handleModalOpen = (type) => {
    setShipmentType(type);
    setModalOpen(true);
    if (type === ShipmentType.EXPORT) {
      setNewShipment((prev) => ({ ...prev, from: selectedPlanet.name, to: "" }));
    } else {
      setNewShipment((prev) => ({ ...prev, from: "", to: selectedPlanet.name }));
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setNewShipment({
      from: "",
      to: "",
      tons: 0,
      cbm: 0,
      priceType: PriceType.EXACT,
      priceValue: "",
      deadline: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewShipment((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddShipment = () => {
    console.log("Adding new shipment:", newShipment, " for planet:", selectedPlanet.id);
    handleModalClose();
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedShipments = useMemo(() => {
    let sortableShipments = [...shipments];
    if (sortConfig.key !== null) {
      sortableShipments.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableShipments;
  }, [shipments, sortConfig]);

  // Main Planets View
  if (!selectedPlanet) {
    return (
      <Box
        sx={{
          backgroundColor: "#111827",
          p: 4,
          minHeight: "100vh",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <Grid container spacing={4} justifyContent="center">
          {mockPlanets.map((planet) => (
            <Grid item xs={12} sm={6} md={4} key={planet.id}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 3,
                  backgroundColor: "#1f2937",
                  "&:hover": {
                    backgroundColor: "#374151",
                    transition: "background-color 0.3s",
                  },
                  cursor: "pointer",
                  border: "1px solid #4b5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
                onClick={() => handlePlanetSelect(planet.id)}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: "#4b5563",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#a78bfa",
                    }}
                  >
                    <RocketLaunch sx={{ fontSize: "2rem" }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {planet.name}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: "#9ca3af" }}>
                  {planet.description}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    mt: 2,
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#9ca3af", fontWeight: "medium" }}
                    >
                      IMPORTS
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#4ade80", fontWeight: "bold" }}
                    >
                      {planet.totalShipmentImports}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "#9ca3af", fontWeight: "medium" }}
                    >
                      EXPORTS
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#f87171", fontWeight: "bold" }}
                    >
                      {planet.totalShipmentExports}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Planet Details View
  return (
    <Box
      sx={{
        backgroundColor: "#111827",
        p: 4,
        minHeight: "100vh",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Button
          onClick={handleBackToPlanets}
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{
            color: "#a78bfa",
            borderColor: "#a78bfa",
            "&:hover": { backgroundColor: "rgba(167, 139, 250, 0.1)" },
          }}
        >
          Back to Planets
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
          {selectedPlanet.name}
        </Typography>
      </Stack>

      {isLoading ? (
        <Typography variant="h6" sx={{ color: "#9ca3af", textAlign: "center", py: 4 }}>
          Loading data...
        </Typography>
      ) : (
        <>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: 3,
              backgroundColor: "#1f2937",
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "semibold", mb: 2 }}>
              Planet Information
            </Typography>
            <Typography variant="body1" sx={{ color: "#9ca3af", mb: 2 }}>
              {selectedPlanet.description}
            </Typography>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Total Inbound
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold", color: "#4ade80" }}>
                  {selectedPlanet.totalTonsIn} tons / {selectedPlanet.totalCbmIn} m³
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Total Outbound
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold", color: "#f87171" }}>
                  {selectedPlanet.totalTonsOut} tons / {selectedPlanet.totalCbmOut} m³
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<Add />}
                onClick={() => handleModalOpen(ShipmentType.IMPORT)}
                sx={{ borderRadius: 2 }}
              >
                Add Inbound Shipment
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                startIcon={<Add />}
                onClick={() => handleModalOpen(ShipmentType.EXPORT)}
                sx={{ borderRadius: 2 }}
              >
                Add Outbound Shipment
              </Button>
            </Grid>
          </Grid>

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: 3,
              backgroundColor: "#1f2937",
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "semibold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <TableChart /> Shipments
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#9ca3af" }}>
                      <TableSortLabel
                        active={sortConfig.key === "type"}
                        direction={sortConfig.key === "type" ? sortConfig.direction : "asc"}
                        onClick={() => requestSort("type")}
                        sx={{ color: "#9ca3af" }}
                      >
                        Type
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>
                      <TableSortLabel
                        active={sortConfig.key === "from"}
                        direction={sortConfig.key === "from" ? sortConfig.direction : "asc"}
                        onClick={() => requestSort("from")}
                        sx={{ color: "#9ca3af" }}
                      >
                        From
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>
                      <TableSortLabel
                        active={sortConfig.key === "to"}
                        direction={sortConfig.key === "to" ? sortConfig.direction : "asc"}
                        onClick={() => requestSort("to")}
                        sx={{ color: "#9ca3af" }}
                      >
                        To
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>Tons</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>m³</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>Price</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>Deadline</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedShipments.length > 0 ? (
                    sortedShipments.map((shipment) => (
                      <TableRow
                        key={shipment.id}
                        sx={{ "&:hover": { backgroundColor: "#374151" } }}
                      >
                        <TableCell>
                          <Chip
                            label={shipment.type}
                            color={shipment.type === "Import" ? "success" : "error"}
                            size="small"
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                        <TableCell>{shipment.from || "N/A"}</TableCell>
                        <TableCell>{shipment.to || "N/A"}</TableCell>
                        <TableCell>{shipment.tons}</TableCell>
                        <TableCell>{shipment.cbm}</TableCell>
                        <TableCell>{shipment.price}</TableCell>
                        <TableCell>{shipment.deadline}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: "#9ca3af", py: 2 }}>
                        No shipments found for this planet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: 3,
              backgroundColor: "#1f2937",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "semibold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Storefront /> Available Ship Rentals
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#9ca3af" }}>Ship Owner</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>Available Tons</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>Available m³</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>Total Ship Capacity</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>Price</TableCell>
                    <TableCell sx={{ color: "#9ca3af" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rentals.length > 0 ? (
                    rentals.map((rental) => (
                      <TableRow
                        key={rental.id}
                        sx={{ "&:hover": { backgroundColor: "#374151" } }}
                      >
                        <TableCell sx={{ color: "#a78bfa", display: "flex", alignItems: "center", gap: 1 }}>
                          <People sx={{ fontSize: "1rem" }} />
                          {rental.ownerId}
                        </TableCell>
                        <TableCell>{rental.tonsAvailable}</TableCell>
                        <TableCell>{rental.cbmAvailable}</TableCell>
                        <TableCell>
                          {rental.totalTons} tons / {rental.totalCbm} m³
                        </TableCell>
                        <TableCell sx={{ color: "#facc15", display: "flex", alignItems: "center", gap: 1 }}>
                          <PriceChange sx={{ fontSize: "1rem" }} />
                          {rental.price}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              color: "#a78bfa",
                              borderColor: "#a78bfa",
                              "&:hover": { backgroundColor: "rgba(167, 139, 250, 0.1)" },
                            }}
                          >
                            Request Space
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: "#9ca3af", py: 2 }}>
                        No rental spaces available at this time.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Modal open={modalOpen} onClose={handleModalClose}>
            <ModalContent>
              <Typography variant="h6" component="h2" sx={{ textAlign: "center", fontWeight: "bold" }}>
                Add New {shipmentType} Shipment
              </Typography>
              <TextField
                label="From"
                name="from"
                value={newShipment.from}
                onChange={handleInputChange}
                fullWidth
                disabled={shipmentType === ShipmentType.EXPORT}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
              <TextField
                label="To"
                name="to"
                value={newShipment.to}
                onChange={handleInputChange}
                fullWidth
                disabled={shipmentType === ShipmentType.IMPORT}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
              <TextField
                label="Total Tons"
                name="tons"
                type="number"
                value={newShipment.tons}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                inputProps={{ min: "0" }}
                sx={{ borderRadius: 2 }}
              />
              <TextField
                label="Total m³"
                name="cbm"
                type="number"
                value={newShipment.cbm}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                inputProps={{ min: "0" }}
                sx={{ borderRadius: 2 }}
              />
              <TextField
                select
                label="Price Type"
                name="priceType"
                value={newShipment.priceType}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                {Object.values(PriceType).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Price Details"
                name="priceValue"
                value={newShipment.priceValue}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                sx={{ borderRadius: 2 }}
                placeholder={
                  newShipment.priceType === PriceType.NEGOTIABLE
                    ? "Negotiable"
                    : "e.g., 10,000 - 15,000 CR"
                }
              />
              <TextField
                label="Deadline"
                name="deadline"
                type="date"
                value={newShipment.deadline}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={{ borderRadius: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleAddShipment}
                sx={{
                  backgroundColor: "#7c3aed",
                  "&:hover": { backgroundColor: "#6d28d9" },
                  color: "white",
                  fontWeight: "bold",
                  borderRadius: 2,
                }}
              >
                Add Shipment
              </Button>
            </ModalContent>
          </Modal>
        </>
      )}
    </Box>
  );
};

export default ShippingBoard;
 */

// THIS WILL GET REWORKED