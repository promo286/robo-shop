#
# Build Stage
#
FROM maven:3.8.7-eclipse-temurin-8 AS build

WORKDIR /opt/shipping

# Copy only necessary files first to leverage Docker cache
COPY pom.xml /opt/shipping/
RUN mvn dependency:resolve

# Copy the source code after resolving dependencies
COPY src /opt/shipping/src/
RUN mvn package -DskipTests

#
# Run Stage
#
FROM openjdk:8-jdk

EXPOSE 8080

WORKDIR /opt/shipping

# Set environment variables
ENV CART_ENDPOINT=cart:8080
ENV DB_HOST=mysql

# Copy the built JAR from the build stage
COPY --from=build /opt/shipping/target/shipping-1.0.jar shipping.jar

# Run the application
CMD [ "java", "-Xmn256m", "-Xmx768m", "-jar", "shipping.jar" ]
