# Blog Platform with Comments

A full-stack blog application built with React, Vite, Express, TypeScript, and Tailwind CSS.

The project includes:
- A React frontend powered by Vite
- An Express backend server with REST APIs
- Blog posts and comment support
- Simple local development setup

## Features

- View posts and comments
- Post commenting functionality
- User registration and login
- Express server endpoints for API requests
- TypeScript support throughout the app

## Prerequisites

- Node.js 18+ installed
- npm available from the command line

## Setup

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and update the values:
   `cp .env.example .env`
3. Run the app locally:
   `npm run dev`

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build the frontend and bundle the server
- `npm run start` - run the built server
- `npm run preview` - preview the production build
- `npm run clean` - remove build artifacts
- `npm run lint` - run TypeScript type checking

## Environment

Create a local `.env` file with the values from `.env.example`.

- `GEMINI_API_KEY` - optional external API key for third-party services
- `APP_URL` - base URL where the application is hosted

## Notes

This repository is a blog platform example with a React frontend and an Express backend. It is configured to run locally with Vite and TypeScript.
