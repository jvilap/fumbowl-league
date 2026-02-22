"use client";
import dynamic from "next/dynamic";
const CoachEloChart = dynamic(() => import("./CoachEloChart"), { ssr: false });
export default CoachEloChart;
