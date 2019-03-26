# twitter-analysis
Desarrollo de un sitio web que muestre en tiempo real las zonas geográficas donde se está hablando sobre diferentes 
motores de bases de datos, usando para ello datos de Twitter.

La aplicación hace uso de PySpark para producir, consumir y evaluar los datos. Kafka se usará como vehículo para 
publicar los "mensajes" (tweets) al consumidor. 

La base de datos utilizada para almacenar los tweets es MongoDB, mientras que para almacenar datos sobre ubicaciones y 
sus coordenadas se usa una caché Redis.
