import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchClient } from "../../utils/apiclient";
import { useGlobalWsContext } from "../websocket/globalwscontext";
import type { Bank, BankLoanRecord } from "./types";
import { calculateVaultMetrics, type VaultMetrics } from "./helpers";

export interface CreateBankFormState {
	name: string;
	headline: string;
	liquidity: number | "";
	currency: string;
	interestRate: number | "";
	repayDays: number | "";
	interval: number | "";
	minLoan: number | "";
	maxLoan: number | "";
	description: string;
	isPublic: boolean;
}

export interface UseBankingDataResult {
	myBank: Bank | null;
	allBanks: Bank[];
	bankLoans: BankLoanRecord[];
	myBorrowings: BankLoanRecord[];
	loading: boolean;
	vaultMetrics: VaultMetrics;
	loadBankingData: () => Promise<void>;
	syncLoans: () => Promise<void>;
	isSyncing: boolean;
	// Form State matching Create Bank Wireframe
	form: CreateBankFormState;
	setFormField: <K extends keyof CreateBankFormState>(
		field: K,
		value: CreateBankFormState[K],
	) => void;
	resetForm: () => void;
	creating: boolean;
	createError: string | null;
	setCreateError: (val: string | null) => void;
	handleCreateBank: (e?: React.FormEvent) => Promise<boolean>;
}

const initialFormState: CreateBankFormState = {
	name: "",
	headline: "",
	liquidity: 0,
	currency: "ICA",
	interestRate: 5.0,
	repayDays: 14,
	interval: 7,
	minLoan: 5000,
	maxLoan: 500000,
	description: "",
	isPublic: true,
};

export const useBankingData = (): UseBankingDataResult => {
	const [myBank, setMyBank] = useState<Bank | null>(null);
	const [allBanks, setAllBanks] = useState<Bank[]>([]);
	const [bankLoans, setBankLoans] = useState<BankLoanRecord[]>([]);
	const [myBorrowings, setMyBorrowings] = useState<BankLoanRecord[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	// Create Bank Form State
	const [form, setForm] = useState<CreateBankFormState>(initialFormState);
	const [creating, setCreating] = useState<boolean>(false);
	const [createError, setCreateError] = useState<string | null>(null);

	const setFormField = useCallback(
		<K extends keyof CreateBankFormState>(
			field: K,
			value: CreateBankFormState[K],
		) => {
			setForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const resetForm = useCallback(() => {
		setForm(initialFormState);
		setCreateError(null);
	}, []);

	const loadBankingData = useCallback(async () => {
		try {
			// 1. My Bank
			const mbRes = await fetchClient("/internal/banking/my-bank");
			const mbData = mbRes.ok ? await mbRes.json() : null;
			setMyBank(mbData);

			// 2. All Public Banks
			const bRes = await fetchClient("/internal/banking");
			const bData = bRes.ok ? await bRes.json() : [];
			setAllBanks(bData || []);

			// 3. If user has a bank, fetch loans linked/received by it
			if (mbData?.id) {
				const recRes = await fetchClient(
					`/internal/banking/loans/received?bank_id=${mbData.id}`,
				);
				const recData = recRes.ok ? await recRes.json() : [];
				setBankLoans(recData || []);
			} else {
				setBankLoans([]);
			}

			// 4. User's own borrowings from other banks
			const reqRes = await fetchClient("/internal/banking/loans/requested");
			const reqData = reqRes.ok ? await reqRes.json() : [];
			setMyBorrowings(reqData || []);
		} catch (e) {
			console.error("Failed to load banking data", e);
		} finally {
			setLoading(false);
		}
	}, []);

	const { addMessageListener, removeMessageListener } = useGlobalWsContext();
	const [isSyncing, setIsSyncing] = useState<boolean>(false);

	const syncLoans = useCallback(async () => {
		setIsSyncing(true);
		try {
			await fetchClient("/internal/banking/sync", { method: "POST" });
			await loadBankingData();
		} catch (e) {
			console.error("Failed to sync loans", e);
		} finally {
			setIsSyncing(false);
		}
	}, [loadBankingData]);

	useEffect(() => {
		const handleWsMessage = (msg: any) => {
			if (msg?.type === "BANKING_DATA_UPDATE") {
				loadBankingData();
			}
		};
		addMessageListener(handleWsMessage);
		return () => {
			removeMessageListener(handleWsMessage);
		};
	}, [addMessageListener, removeMessageListener, loadBankingData]);

	useEffect(() => {
		loadBankingData();
	}, [loadBankingData]);

	const handleCreateBank = async (e?: React.FormEvent): Promise<boolean> => {
		if (e) e.preventDefault();
		if (!form.name.trim()) {
			setCreateError("Bank name is required.");
			return false;
		}
		setCreating(true);
		setCreateError(null);
		try {
			const res = await fetchClient("/internal/banking", {
				method: "POST",
				body: JSON.stringify({
					name: form.name.trim(),
					headline: form.headline.trim() || null,
					description: form.description.trim(),
					liquidity: form.liquidity === "" ? 0 : Number(form.liquidity),
					default_interest_rate:
						form.interestRate === "" ? 0 : Number(form.interestRate),
					currency: form.currency || "ICA",
					default_repay_days:
						form.repayDays === "" ? 0 : Number(form.repayDays),
					default_interval: String(form.interval === "" ? 0 : form.interval),
					min_loan_amount: form.minLoan === "" ? 0 : Number(form.minLoan),
					max_loan_amount: form.maxLoan === "" ? 0 : Number(form.maxLoan),
					is_public: form.isPublic,
				}),
			});
			if (res.ok) {
				await loadBankingData();
				resetForm();
				return true;
			} else {
				const err = await res.json().catch(() => ({}));
				setCreateError(err.detail || "Failed to establish bank.");
				return false;
			}
		} catch (err: any) {
			setCreateError(err.message || "Failed to establish bank.");
			return false;
		} finally {
			setCreating(false);
		}
	};

	const vaultMetrics = useMemo(() => {
		return calculateVaultMetrics(myBank, bankLoans);
	}, [myBank, bankLoans]);

	return {
		myBank,
		allBanks,
		bankLoans,
		myBorrowings,
		loading,
		vaultMetrics,
		loadBankingData,
		syncLoans,
		isSyncing,
		form,
		setFormField,
		resetForm,
		creating,
		createError,
		setCreateError,
		handleCreateBank,
	};
};
