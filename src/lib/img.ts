// Central image registry — imported through the module graph so the
// single-file build inlines every asset into dist/index.html.
import hero from "../assets/images/hero.jpg";
import football from "../assets/images/col-football.jpg";
import running from "../assets/images/col-running.jpg";
import gym from "../assets/images/col-gym.jpg";
import shoe from "../assets/images/prod-shoe.jpg";
import jersey from "../assets/images/prod-jersey.jpg";
import bag from "../assets/images/prod-bag.jpg";
import hoodie from "../assets/images/prod-hoodie.jpg";
import cta from "../assets/images/cta.jpg";
import journal from "../assets/images/journal.jpg";

export const IMG = {
  hero,
  football,
  running,
  gym,
  shoe,
  jersey,
  bag,
  hoodie,
  cta,
  journal,
};
