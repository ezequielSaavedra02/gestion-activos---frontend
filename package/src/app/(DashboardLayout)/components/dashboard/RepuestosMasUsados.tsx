'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import dynamic from "next/dynamic";
import { Typography, Box } from '@mui/material';
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const RepuestosMasUsados = () => {
  const [chartConfig, setChartConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    fetch('http://127.0.0.1:5001/api/stats/repuestos-usados')
      .then(response => {
        if (!response.ok) throw new Error('La respuesta de la red no fue correcta');
        return response.json();
      })
      .then(apiData => {
        console.log('Datos recibidos para Repuestos:', apiData);

        if (!apiData || apiData.length === 0) {
          setLoading(false);
          return;
        }

        const formattedData = apiData.map((item: any) => ({
          nombre: item.nombre_repuesto || 'N/A',
          cantidad: item.consumo_total || 0,
        }));

        const options = {
          chart: { type: 'donut', fontFamily: "'Plus Jakarta Sans', sans-serif;", foreColor: '#adb0bb', toolbar: { show: false } },
          colors: [theme.palette.warning.main, theme.palette.primary.main, theme.palette.secondary.main],
          labels: formattedData.map((item: any) => item.nombre),
          legend: { show: true, position: 'bottom' },
          dataLabels: { enabled: false },
          tooltip: { theme: 'dark', fillSeriesColor: false }
        };
        const series = formattedData.map((item: any) => item.cantidad);

        setChartConfig({ options, series });
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al obtener estadísticas de repuestos:", err);
        setError('No se pudieron cargar los datos de los repuestos.');
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
      return <Typography sx={{ p: 2 }}>No hay datos de repuestos para mostrar.</Typography>;
    }

    // **DEBUG: Imprimir la configuración final del gráfico**
    console.log('Configuración final para Repuestos:', chartConfig);

    return (
      <Box sx={{ width: '100%' }}>
        <Chart options={chartConfig.options} series={chartConfig.series} type="donut" height={250} width={"100%"} />
      </Box>
    );
  };

  return (
    <DashboardCard title="Repuestos Más Usados">
      {renderContent()}
    </DashboardCard>
  );
};

export default RepuestosMasUsados;
