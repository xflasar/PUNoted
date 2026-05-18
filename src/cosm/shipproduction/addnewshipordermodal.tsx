/**
 * Draft JSX for the Add New Ship Order Modal.
 * Currently commented out as the feature is not yet active.
 * This represents the UI structure for adding a new ship order manually.
 */
/*
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
*/
