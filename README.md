# Emadaldin App

**Emadaldin** is a Node.js application using MongoDB and Cloudinary to provide technician services in Riyadh.

---

## 1. Requirements

- Node.js >= 18
- npm or yarn
- MongoDB Atlas 
- Cloudinary account for image uploads and processing

---

## 2. Environment Variables

Create a `.env` file in the root of the project and add the following:

```env
PORT=3000
MONGODB_URI=mongodb+srv://hennd123:HENND123456789@cluster0.0ggnpj7.mongodb.net/Ask-for-a-technician?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=dw4sqpgty
CLOUDINARY_API_KEY=671829593186537
CLOUDINARY_API_SECRET=olHzt0J74uwr9p_RVZMfAeQl6v8
ADMIN_EMAIL=mariamrady3012@gmail.com
ADMIN_PASSWORD=mariamrady3012
```

## Install Dependencies
```
git clone https://github.com/Dina170/Ask-for-a-Technician-app.git
cd Ask-for-a-Technician-app
npm install
```

## Run the Server

Using nodemon (auto-reload on changes):
```
npx nodemon app.js
```
Using node:
```
node app.js
```

The server will run on the port specified in .env, usually http://localhost:3000.


## Admin Access
Admin Email: mariamrady3012@gmail.com

Admin Password: mariamrady3012