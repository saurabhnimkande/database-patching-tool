import { axiosInstance } from '../utils/axios';

// Database related API calls
export const fetchDatabaseList = async () => {
  return await axiosInstance.get('/db-config/database-list');
};

export const fetchDatabaseSchemas = async (databaseName) => {
  return await axiosInstance.get(`/db-config/database-schemas/${databaseName}`);
};

export const fetchDatabaseTables = async (database, schema) => {
  return await axiosInstance.get(`/db-config/database-tables/${database}/${schema}`);
};

export const fetchDatabaseViews = async (database, schema) => {
  return await axiosInstance.get(`/db-config/database-views/${database}/${schema}`);
};

export const addDatabase = async (data) => {
  return await axiosInstance.post('/db-config/add-database', data);
};

export const updateDatabase = async (data) => {
  return await axiosInstance.put(`/db-config/update-database/${data.name}`, data);
};

export const deleteDatabase = async (name) => {
  return await axiosInstance.delete(`/db-config/delete-database/${name}`);
};

export const testDatabaseConnection = async (data) => {
  return await axiosInstance.post('/db-config/test-connection', data);
};

// Pipeline related API calls
export const createPipeline = async (data) => {
  return await axiosInstance.post('/pipelines/create', data);
};

export const updatePipeline = async (id, data) => {
  return await axiosInstance.put(`/pipelines/${id}`, data);
};

export const deletePipeline = async (id) => {
  return await axiosInstance.delete(`/pipelines/${id}`);
};

export const startPipeline = async (id) => {
  return await axiosInstance.post(`/pipelines/${id}/start`);
};

export const cancelPipeline = async (id) => {
  return await axiosInstance.post(`/pipelines/${id}/cancel`);
};
