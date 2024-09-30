git reset HEAD~1
rm ./backport.sh
git cherry-pick 0ef2052fb9ee2aca9c273847ab90d866cf1cad8a
echo 'Resolve conflicts and force push this branch'
