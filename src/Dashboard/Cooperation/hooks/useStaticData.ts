import { useState, useEffect, useCallback } from 'react';
import type { StaticData } from '../types';

const CACHE_KEY = 'pu_static_data_cache';
const API_BASE_URL = "https://api.punoted.net/dev/"; // Make sure this matches your backend port!

export const useStaticData = () => {
    const [staticData, setStaticData] = useState<StaticData | null>(null);
    const [isStaticDataLoading, setIsStaticDataLoading] = useState<boolean>(true);
    const [staticDataError, setStaticDataError] = useState<string | null>(null);

    const loadData = useCallback(async (forceBypass = false) => {
        setIsStaticDataLoading(true);
        setStaticDataError(null);

        try {
            // 1. Fetch Buildings (The one you actually built!)
            const buildingsRes = await fetch(`${API_BASE_URL}internal/buildings/`);
            if (!buildingsRes.ok) throw new Error("Failed to fetch buildings.");
            const buildings = await buildingsRes.json();

            // 2. STUB the missing endpoints for now so the app doesn't crash
            // (Replace these with actual fetch calls once you build their routers)
            const materialsRes = await fetch(`${API_BASE_URL}internal/materials/`);
            if (!materialsRes.ok) throw new Error("Failed to fetch materials.");
            const materials = await materialsRes.json();
            const prices = {};
            const needs = {};

            const fetchedData: StaticData = {
                materials,
                buildings,
                prices,
                needs
            };

            // 3. Save to LocalStorage
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: fetchedData,
                hash: `manual-${Date.now()}`
            }));

            setStaticData(fetchedData);
            console.log("Successfully fetched buildings from DB!", buildings);

        } catch (err: any) {
            console.error("Static Data Fetch Error:", err);
            
            const cachedPayload = localStorage.getItem(CACHE_KEY);
            if (cachedPayload) {
                setStaticData(JSON.parse(cachedPayload).data);
            } else {
                setStaticDataError(err.message);
            }
        } finally {
            setIsStaticDataLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { 
        staticData, 
        isStaticDataLoading, 
        staticDataError,
        forceRefetch: () => loadData(true) 
    };
};