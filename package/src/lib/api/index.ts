// src/lib/api/index.ts
import axiosClient from './axiosClient';
import ordenesMantenimientoApi from './endpoints/ordenesMantenimiento';
import equiposApi from './endpoints/equipos';
import impresorasApi from './endpoints/impresoras';
import repuestosApi from './endpoints/repuestos';

export {
    axiosClient,
    ordenesMantenimientoApi,
    equiposApi,
    impresorasApi,
    repuestosApi
};