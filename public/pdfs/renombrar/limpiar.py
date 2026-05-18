import os

def renombrar_aqui():
    # El punto '.' significa "esta misma carpeta"
    ruta_actual = '.' 
    
    archivos = os.listdir(ruta_actual)
    
    for nombre_archivo in archivos:
        # No queremos que el programa se intente renombrar a sí mismo
        if nombre_archivo.endswith('.py'):
            continue
            
        ruta_antigua = os.path.join(ruta_actual, nombre_archivo)
        
        if os.path.isfile(ruta_antigua):
            nombre, extension = os.path.splitext(nombre_archivo)
            
            # Cogemos solo los 4 primeros caracteres
            nuevo_nombre = nombre[:4] + extension
            
            ruta_nueva = os.path.join(ruta_actual, nuevo_nombre)
            
            # Solo renombra si el nombre realmente va a cambiar
            if nombre_archivo != nuevo_nombre:
                try:
                    os.rename(ruta_antigua, ruta_nueva)
                    print(f"OK: {nombre_archivo} -> {nuevo_nombre}")
                except Exception as e:
                    print(f"Error con {nombre_archivo}: {e}")

if __name__ == "__main__":
    print("Iniciando renombrado masivo...")
    renombrar_aqui()
    print("¡Tarea finalizada!")