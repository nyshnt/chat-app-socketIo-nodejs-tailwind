import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from 'react-router-dom'
import './index.css'
import Home from './components/Home/Home'


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Home />} />
  )
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)