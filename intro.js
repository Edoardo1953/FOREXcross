// intro.js

document.addEventListener("DOMContentLoaded", function() {
    const welcomeScreen = document.getElementById("welcome-screen");
        const container = document.querySelector(".container");
            const introLines = document.querySelectorAll(".intro-line");

                // Prepara le linee per l'animazione: rendile invisibili e spostale leggermente
                    introLines.forEach(line => {
                            line.style.opacity = "0";
                                    line.style.transform = "translateY(20px)";
                                            line.style.transition = "opacity 1s ease, transform 1s ease";
                                                });

                                                    // Funzione per animare le linee in sequenza
                                                        function showIntro() {
                                                                introLines.forEach((line, index) => {
                                                                            setTimeout(() => {
                                                                                            line.style.opacity = "1";
                                                                                                            line.style.transform = "translateY(0)";
                                                                                                                        }, index * 1000); // Ritardo di 1 secondo tra ogni riga
                                                                                                                                });
                                                                                                                                
                                                                                                                                        // Dopo che tutte le righe sono apparse, attendi un po' e poi mostra la dashboard
                                                                                                                                                setTimeout(() => {
                                                                                                                                                            welcomeScreen.style.opacity = "0";
                                                                                                                                                                        welcomeScreen.style.transition = "opacity 1s ease";
                                                                                                                                                                                    
                                                                                                                                                                                                setTimeout(() => {
                                                                                                                                                                                                                welcomeScreen.style.display = "none";
                                                                                                                                                                                                                                container.style.display = "block";
                                                                                                                                                                                                                                                container.style.opacity = "0";
                                                                                                                                                                                                                                                                container.style.transition = "opacity 1s ease";
                                                                                                                                                                                                                                                                                setTimeout(() => {
                                                                                                                                                                                                                                                                                                    container.style.opacity = "1";
                                                                                                                                                                                                                                                                                                                    }, 50);
                                                                                                                                                                                                                                                                                                                                }, 1000);
                                                                                                                                                                                                                                                                                                                                        }, (introLines.length * 1000) + 1000); // Tempo totale dell'intro + 1 secondo di attesa
                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                // Avvia l'intro
                                                                                                                                                                                                                                                                                                                                                    showIntro();
                                                                                                                                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                                                                                                                                    
