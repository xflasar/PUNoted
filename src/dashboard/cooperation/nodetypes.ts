import React from "react";
import MinimalistFlowCard from "./minimalistflowcard";
import GroupNode from "./components/groupnode";

const MemoizedMinimalistNode = React.memo((props: any) =>
	React.createElement(MinimalistFlowCard, { ...props, data: props.data }),
);

const globalKey = "__GLOBAL_NODE_TYPES__";

if (!(globalKey in globalThis)) {
	(globalThis as any)[globalKey] = Object.freeze({
		minimalistNode: MemoizedMinimalistNode,
		groupNode: GroupNode,
	});
}

export const NODE_TYPES = (globalThis as any)[globalKey];
