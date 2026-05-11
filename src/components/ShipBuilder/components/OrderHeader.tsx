import React from "react";
import { Grid, TextField, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

const textFieldTheme = {
	"& .MuiOutlinedInput-root": {
		"& fieldset": { borderColor: "rgba(255, 255, 255, 0.23)" },
		"&:hover fieldset": { borderColor: "#66b2ff" },
		"&.Mui-focused fieldset": { borderColor: "#66b2ff" },
	},
	"& .MuiInputLabel-root": { color: "text.secondary" },
	"& .MuiInputBase-input": { color: "white" },
};

const Item = styled(Paper)(({ theme }) => ({
	backgroundColor: "transparent",
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: "center",
	color: (theme.vars ?? theme).palette.text.secondary,
	...theme.applyStyles("dark", {
		backgroundColor: "transparent",
	}),
}));

const OrderHeader = ({ identity, isCorpMember, setIdentity }) => {
	return (
		<Grid container size={2} spacing={2}>
			<Item>
				<TextField
					fullWidth
					label="PRUN Username *"
					variant="outlined"
					size="small"
					value={identity.username}
					onChange={(e) =>
						setIdentity({ ...identity, username: e.target.value })
					}
					sx={textFieldTheme}
				/>
			</Item>
			<Item>
				<TextField
					fullWidth
					label="Company Code (Required)"
					variant="outlined"
					size="small"
					value={identity.company}
					onChange={(e) =>
						setIdentity({ ...identity, company: e.target.value })
					}
					helperText={isCorpMember ? "Corp Pricing Unlocked" : ""}
					FormHelperTextProps={{
						sx: {
							color: isCorpMember ? "success.main" : "text.secondary",
							m: 0,
							pt: 0.5,
						},
					}}
					sx={textFieldTheme}
				/>
			</Item>
		</Grid>
	);
};

export default OrderHeader;
