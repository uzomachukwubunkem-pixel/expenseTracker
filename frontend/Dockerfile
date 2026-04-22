<<<<<<< HEAD
=======
# Build stage
>>>>>>> 3589132122fdc407d7481176023c43f57a74d36e
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

<<<<<<< HEAD
=======
# Production stage
>>>>>>> 3589132122fdc407d7481176023c43f57a74d36e
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
<<<<<<< HEAD
CMD ["nginx", "-g", "daemon off;"]
=======
CMD ["nginx", "-g", "daemon off;"]
>>>>>>> 3589132122fdc407d7481176023c43f57a74d36e
