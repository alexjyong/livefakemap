import Container from "@mui/material/Container";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Map from "./map";
import {
    Box,
    Card,
    CardContent,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";

export default function Page() {
    const [iconUrl, setIconUrl] = useState("bomb.svg");
    const mapRef = useRef(null);

    const icons = [
        { label: "Bomb", value: "bomb.svg", type: "image" },
        { label: "Gun", value: "gun.svg", type: "image" },
        { label: "Drone", value: "drone.svg", type: "image" },
        { label: "Ship", value: "ship.svg", type: "image" },
        { label: "Fire", value: "fire.svg", type: "image" },
        { label: "Missile", value: "missile.svg", type: "image" },
        { label: "FPV", value: "fpv.svg", type: "image" },
        { label: "Red", value: "red_icon.svg", type: "image" },
        { label: "Blue", value: "blue_icon.svg", type: "image" },
        { label: "Green", value: "green_icon.svg", type: "image" },
    ];

    const handleClear = (icon: string) => {
        mapRef.current?.clearMarkersByType(icon);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* Full height layout */}
            <Box sx={{ height: "80vh", display: "flex", flexDirection: "column" }}>
                {/* Top icon bar */}
                <Box
                    sx={{
                        height: 64,
                        px: 2,
                        py: 1,
                        borderBottom: "1px solid #ccc",
                        backgroundColor: "#fff",
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center" overflow="auto">
                        {icons.map((icon) => (
                            <Box key={icon.value} textAlign="center">
                                <IconButton
                                    onClick={() => setIconUrl(icon.value)}
                                    sx={{
                                        border: iconUrl === icon.value ? "2px solid #1976d2" : "1px solid #ccc",
                                        borderRadius: 2,
                                        padding: 0.5,
                                        backgroundColor: iconUrl === icon.value ? "#e3f2fd" : "transparent",
                                        width: 40,
                                        height: 40,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {icon.type === "image" ? (
                                        <img
                                            src={icon.value}
                                            alt={icon.label}
                                            width={24}
                                            height={24}
                                            style={{ display: "block" }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: "20px" }}>{icon.emoji}</span>
                                    )}
                                </IconButton>
                                <Box mt={0.5}>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleClear(icon.value)}
                                        aria-label={`Clear ${icon.label}`}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* Main content area (map + sidebar) */}
                <Box sx={{ display: "flex", flexGrow: 1 }}>
                    {/* Map section */}
                    <Box sx={{ flexGrow: 1 }}>
                        <Map iconUrl={iconUrl} ref={mapRef} />
                    </Box>

                    {/* Sidebar */}
                    <Box
                        sx={{
                            width: 300,
                            borderLeft: "1px solid #ccc",
                            p: 2,
                            backgroundColor: "#fafafa",
                            overflowY: "auto",
                        }}
                    >
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Sidebar Info
                                </Typography>
                                <Typography variant="body2">
                                    This sidebar extends full height on the right.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>
        </LocalizationProvider>
    );
}
