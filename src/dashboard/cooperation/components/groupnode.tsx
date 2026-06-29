import { memo, useEffect, useState } from "react";
import { NodeResizer, useReactFlow } from "reactflow";
import { Box, InputBase } from "@mui/material";

const GroupNode = ({ id, data, selected }: any) => {
	const [label, setLabel] = useState(data.siteName || "Location Group");
	const { setNodes } = useReactFlow();

	useEffect(() => {
		setLabel(data.siteName || "Location Group");
	}, [data.siteName]);

	const handleBlur = () => {
		setNodes((nds) =>
			nds.map((n) => {
				if (n.id === id) {
					return { ...n, data: { ...n.data, siteName: label } };
				}
				return n;
			}),
		);
	};

	return (
		<Box sx={{ width: "100%", height: "100%", position: "relative" }}>
			<NodeResizer
				color="#8B5CF6"
				isVisible={selected}
				minWidth={300}
				minHeight={300}
			/>
			<Box
				sx={{
					width: "100%",
					height: "100%",
					backgroundColor: "rgba(139, 92, 246, 0.05)",
					border: selected
						? "2px solid #8B5CF6"
						: "2px dashed rgba(139, 92, 246, 0.5)",
					borderRadius: 4,
					boxSizing: "border-box",
				}}
			>
				<InputBase
					value={label}
					onChange={(e) => setLabel(e.target.value)}
					onBlur={handleBlur}
					className="nodrag"
					sx={{
						position: "absolute",
						top: -16,
						left: 12,
						fontWeight: "bold",
						color: "#8B5CF6",
						textTransform: "uppercase",
						letterSpacing: 1,
						bgcolor: "background.default",
						px: 1.5,
						py: 0,
						borderRadius: 1,
						border: "1px solid rgba(139, 92, 246, 0.3)",
						fontSize: "0.85rem",
					}}
				/>
			</Box>
		</Box>
	);
};

export default memo(GroupNode);
