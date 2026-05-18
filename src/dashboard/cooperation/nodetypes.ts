import React from "react";
import MinimalistFlowCard from "./minimalistflowcard";
import GroupNode from "./components/groupnode"; // <--- Add this import

const MemoizedMinimalistNode = React.memo((props: any) =>
	React.createElement(MinimalistFlowCard, { ...props, data: props.data }),
);

const globalKey = "__GLOBAL_NODE_TYPES__";

if (!(globalKey in globalThis)) {
	(globalThis as any)[globalKey] = Object.freeze({
		minimalistNode: MemoizedMinimalistNode,
		groupNode: GroupNode, // <--- Register the group node
	});
}

export const NODE_TYPES = (globalThis as any)[globalKey];
