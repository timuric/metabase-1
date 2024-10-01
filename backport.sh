git reset HEAD~1
rm ./backport.sh
git cherry-pick 4b278779ac585a3de20183a7070f0f0fdb47b9b5
echo 'Resolve conflicts and force push this branch'
