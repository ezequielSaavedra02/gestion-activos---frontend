'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import dynamic from "next/dynamic";
import { Typography, Box } from '@mui/material';
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SectoresConMasSolicitudes = () => {
  const [chartConfig, setChartConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    fetch('http://127.0.0.1:5001/api/stats/ubicaciones-solicitudes')
      .then(response => {
        if (!response.ok) throw new Error('La respuesta de la red no fue correcta');
        return response.json();
      })
      .then(apiData => {
        console.log('Datos recibidos para Sectores (Experimento):', apiData);

        if (!apiData || apiData.length === 0) {
          setLoading(false);
          return;
        }

        const formattedData = apiData.map((item: any) => ({
          nombre: item.nombre_ubicacion || 'N/A',
          solicitudes: item.cantidad_solicitudes || 0,
        }));

        // **EXPERIMENTO: Usar la misma configuración del gráfico que funciona (barras horizontales)**
        const options = {
          chart: { type: 'bar', fontFamily: "'Plus Jakarta Sans', sans-serif;", foreColor: '#adb0bb', toolbar: { show: false } },
          colors: [theme.palette.secondary.main], // Mantenemos el color para diferenciarlo
          plotOptions: { 
            bar: { 
              horizontal: true, // Cambiado a true
              barHeight: '45%', 
              borderRadius: [4] 
            } 
          },
          xaxis: { categories: formattedData.map((item: any) => item.nombre) },
          dataLabels: { enabled: false },
          legend: { show: false },
          grid: { borderColor: 'rgba(0,0,0,0.1)', strokeDashArray: 3 },
          tooltip: { theme: 'dark' }
        };
        const series = [{ name: 'Solicitudes', data: formattedData.map((item: any) => item.solicitudes) }];

        setChartConfig({ options, series });
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al obtener estadísticas de sectores:", err);
        setError('No se pudieron cargar los datos de los sectores.');
        setLoading(false);
      });
  }, [theme]);

  const renderContent = () => {
    if (loading) {
      return <Typography sx={{ p: 2 }}>Cargando...</Typography>;
    }
    if (error) {
      return <Typography color="error" sx={{ p: 2 }}>{error}</Typography>;
    }
    if (!chartConfig) {
      return <Typography sx={{ p: 2 }}>No hay datos de solicitudes para mostrar.</Typography>;
    }
    return (
      <Box sx={{ width: '100%' }}>
        <Chart options={chartConfig.options} series={chartConfig.series} type="bar" height={250} width={"100%"} />
      </Box>
    );
  };

  return (
    <DashboardCard title="Sectores con Más Solicitudes">
      {renderContent()}
    </DashboardCard>
  );
};

export default SectoresConMasSolicitudes;
