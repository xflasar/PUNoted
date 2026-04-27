import { useState, useEffect, useMemo } from "react";
import {
	Transaction,
	TransactionDetail,
	PublicCompanyProfile,
} from "../types/finance";

export const useDrawerData = (
	selectedTx: Transaction | null,
	selectedPartnerCode: string | null,
	transactions: Transaction[],
) => {
	const [txDetails, setTxDetails] = useState<TransactionDetail | null>(null);
	const [loadingTxDetails, setLoadingTxDetails] = useState<boolean>(false);

	const [companyProfile, setCompanyProfile] =
		useState<PublicCompanyProfile | null>(null);
	const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

	useEffect(() => {
		if (!selectedTx) {
			setTxDetails(null);
			return;
		}
		const fetchTxDetails = async () => {
			setLoadingTxDetails(true);
			try {
				const token = localStorage.getItem("authToken");
				const response = await fetch(
					`https://api.punoted.net/dev/internal/finances/transaction/${selectedTx.Id}`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				if (response.ok) setTxDetails(await response.json());
			} catch (err) {
				console.error("Failed to load transaction details:", err);
			} finally {
				setLoadingTxDetails(false);
			}
		};
		fetchTxDetails();
	}, [selectedTx]);

	useEffect(() => {
		if (!selectedPartnerCode || selectedPartnerCode.includes("CORP")) {
			setCompanyProfile(null);
			return;
		}
		const fetchProfile = async () => {
			setLoadingProfile(true);
			try {
				const response = await fetch(
					`https://api.punoted.net/dev/v1/company/${selectedPartnerCode}`,
				);
				if (response.ok) setCompanyProfile(await response.json());
				else setCompanyProfile(null);
			} catch (err) {
				setCompanyProfile(null);
			} finally {
				setLoadingProfile(false);
			}
		};
		fetchProfile();
	}, [selectedPartnerCode]);

	const selectedPartnerStats = useMemo(() => {
		if (!selectedPartnerCode || transactions.length === 0) return null;
		let totalReceived = 0,
			totalPaid = 0;

		transactions.forEach((tx) => {
			if (tx.PartnerCode === selectedPartnerCode) {
				if (tx.Amount > 0) totalReceived += tx.Amount;
				else totalPaid += Math.abs(tx.Amount);
			}
		});
		return { totalReceived, totalPaid, net: totalReceived - totalPaid };
	}, [selectedPartnerCode, transactions]);

	return {
		txDetails,
		loadingTxDetails,
		companyProfile,
		loadingProfile,
		selectedPartnerStats,
	};
};
