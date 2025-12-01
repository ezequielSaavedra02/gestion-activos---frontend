'use client';
import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

interface HistorialUbicacion {
  id: number;
  nombre_equipo: string;
  ubicacion: string;
  fecha_registro: string;
  ip: string;
}

const MovimientosEquiposRecientes = () => {
  const [historial, setHistorial] = useState<HistorialUbicacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Activando la llamada fetch al endpoint de Python
    fetch('http://127.0.0.1:5001/api/historial/ubicaciones-recientes')
      .then(res => {
        if (!res.ok) {
          throw new Error('La respuesta de la red no fue correcta');
        }
        return res.json();
      })
      .then(data => {
        setHistorial(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error al obtener historial de ubicaciones:", error);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardCard title="Historial de Ubicaciones Recientes">
      <Box sx={{ overflow: 'auto', width: { xs: '280px', sm: 'auto' } }}>
        <Table aria-label="historial reciente" sx={{ whiteSpace: "nowrap", mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Equipo</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Ubicación Registrada</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>IP</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Fecha</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center">Cargando...</TableCell></TableRow>
            ) : historial.length > 0 ? (
              historial.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell><Typography variant="subtitle2">{registro.nombre_equipo}</Typography></TableCell>
                  <TableCell><Chip label={registro.ubicacion} color="default" size="small" /></TableCell>
                  <TableCell><Typography variant="subtitle2">{registro.ip}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">{new Date(registro.fecha_registro).toLocaleDateString()}</Typography></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} align="center">No hay datos para mostrar.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </DashboardCard>
  );
};

export default MovimientosEquiposRecientes;
