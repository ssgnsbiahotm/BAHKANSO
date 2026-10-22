/*
# Bahkanso — Migration 021 : Corrige mot de passe utilisateur E2E
## Objectif
Mettre à jour le hash bcrypt de l'utilisateur e2e@bahkanso.ci avec un hash correct pour 'password123'.
*/

UPDATE auth.users SET encrypted_password = '$2b$10$bsIe0YrO79J9p1ky4zEhsO7OG2lMC2lxbu7JXkCgyQ4BlSxt8/m6y' WHERE email = 'e2e@bahkanso.ci';