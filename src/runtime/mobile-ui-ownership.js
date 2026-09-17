// Mobile Shell v22 ownership contract.
// This module executes before legacy mobile presentation code so transient UI
// state cannot be claimed by multiple runtimes during initial startup.
const root=document.documentElement;
root.dataset.mobileTransientOwner='v22-shell';
root.dataset.mobileNavigationOwner='v22-shell';
root.dataset.mobileSearchOwner='v22-shell';
